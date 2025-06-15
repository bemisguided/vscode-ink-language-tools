/**
 * MIT License
 *
 * Copyright (c) 2025 Martin Crawford
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import * as vscode from "vscode";
import { Story } from "inkjs";
import { IPipelineProcessor } from "./IPipelineProcessor";
import { ICompiledStoryResult } from "./ICompiledStoryResult";
import { PipelineContext } from "./PipelineContext";
import { DependencyManager } from "../model/DependencyManager";
import { DependencyNodeType } from "../model/DependencyNode";
import { DependencyNode } from "../model/DependencyNode";
import { OutlineProcessor } from "./outline/OutlineProcessor";
import { IncludeExtractionProcessor } from "./IncludeExtractionProcessor";
import { CompilationProcessor } from "./compiler/CompilationProcessor";

const MAX_CACHE = 2;

/**
 * The build engine for the Ink language.
 */
export class BuildEngine {
  // Private Properties ===============================================================================================

  private static instance: BuildEngine;
  private processors: IPipelineProcessor[] = [];
  private diagnosticCollection: vscode.DiagnosticCollection;

  // Private Properties ===============================================================================================

  // Cache of last compiled stories: key=uri.toString()
  private storyCache = new Map<
    string,
    { version: number; story: Story; externals: vscode.Uri[] }
  >();
  private lru: string[] = [];

  private constructor(diagnosticCollection: vscode.DiagnosticCollection) {
    this.diagnosticCollection = diagnosticCollection;

    // Register pipeline processors
    this.registerProcessor(new OutlineProcessor());
    this.registerProcessor(new IncludeExtractionProcessor());
    // this.registerProcessor(new MockExtractionProcessor());
    this.registerProcessor(new CompilationProcessor());
  }

  public static getInstance(
    diagnosticCollection: vscode.DiagnosticCollection
  ): BuildEngine {
    if (!BuildEngine.instance) {
      BuildEngine.instance = new BuildEngine(diagnosticCollection);
    }
    return BuildEngine.instance;
  }

  public registerProcessor(processor: IPipelineProcessor) {
    this.processors.push(processor);
  }

  /**
   * Invalidate cache entries depending on a changed URI.
   */
  private invalidateCache(changed: vscode.Uri) {
    const changedKey = changed.toString();
    for (const key of Array.from(this.storyCache.keys())) {
      const entry = this.storyCache.get(key)!;
      const uri = vscode.Uri.parse(key);
      // Evict if the story itself changed or if it depended on this file
      const node = DependencyManager.getInstance().getNode(uri);
      if (key === changedKey || (node && node.deps.has(changed))) {
        this.evict(key);
      }
    }
  }

  // Public Methods ===================================================================================================

  /**
   * Dedupe and return compiled story for a root URI along with externals.
   */
  public async getCompiledStory(
    uri: vscode.Uri
  ): Promise<ICompiledStoryResult> {
    const key = uri.toString();
    const node = DependencyManager.getInstance().getNode(uri);
    if (!node) {
      throw new Error(`URI not in graph: ${uri.fsPath}`);
    }

    // Check cache
    const cached = this.storyCache.get(key);
    if (cached && cached.version === node.version) {
      this.markAsRecentlyUsed(key);
      return { story: cached.story, externals: cached.externals };
    }

    // Not cached or stale: recompile
    // Invalidate before compile
    this.invalidateCache(uri);
    // Run pipeline for this file only
    const compiled = await this.processFile(uri);
    if (!compiled) {
      throw new Error(`Failed to compile story: ${uri.fsPath}`);
    }
    // Gather externals
    const externals = Array.from(node.deps).filter(
      (d) =>
        DependencyManager.getInstance().getNode(d)?.type ===
        DependencyNodeType.externalFunctions
    );

    // Update cache
    this.storyCache.set(key, {
      version: node.version,
      story: compiled,
      externals,
    });
    this.markAsRecentlyUsed(key);
    this.enforceCacheSize();

    return { story: compiled, externals };
  }

  /**
   * Run all pipeline processors on a single file.
   * Returns the compiled Story if this is a root story, otherwise undefined.
   */
  public async processFile(uri: vscode.Uri): Promise<Story | undefined> {
    const depManager = DependencyManager.getInstance();
    if (!depManager.getNode(uri)) {
      depManager.setNode(uri, DependencyNode.fromUri(uri, 0));
    }
    try {
      const doc = await vscode.workspace.openTextDocument(uri);
      DependencyManager.getInstance().getNode(uri)!.version = doc.version;
    } catch {}

    const context = new PipelineContext(uri, this.diagnosticCollection);
    context.resetDeps();
    for (const proc of this.processors) {
      await proc.run(context);
      try {
        const updated = await vscode.workspace.openTextDocument(uri);
        DependencyManager.getInstance().getNode(uri)!.version = updated.version;
      } catch {}
    }
    context.flushDiagnostics();
    return context.compiledStory;
  }

  /**
   * On file change, re-run pipeline for changed file and all dependents.
   * Returns a map of each recompiled root story URI to its Story and externals.
   */
  public async onFileChanged(
    start: vscode.Uri
  ): Promise<Map<vscode.Uri, ICompiledStoryResult>> {
    // Invalidate any cached stories depending on this change
    this.invalidateCache(start);

    const toVisit = [start];
    const seen = new Set<string>();
    const results = new Map<
      vscode.Uri,
      { story: Story; externals: vscode.Uri[] }
    >();

    while (toVisit.length) {
      const uri = toVisit.shift()!;
      const key = uri.toString();
      if (seen.has(key)) {
        continue;
      }
      seen.add(key);

      const compiled = await this.processFile(uri);
      if (compiled) {
        const deps = DependencyManager.getInstance().getNode(uri)!.deps;
        const externals = Array.from(deps).filter(
          (d) =>
            DependencyManager.getInstance().getNode(d)?.type ===
            DependencyNodeType.externalFunctions
        );
        results.set(uri, { story: compiled, externals });
      }

      const node = DependencyManager.getInstance().getNode(uri)!;
      for (const parent of node.revDeps) {
        toVisit.push(parent);
      }
    }

    return results;
  }

  private markAsRecentlyUsed(key: string) {
    const idx = this.lru.indexOf(key);
    if (idx !== -1) {
      this.lru.splice(idx, 1);
    }
    this.lru.unshift(key);
  }

  private evict(key: string) {
    this.storyCache.delete(key);
    const idx = this.lru.indexOf(key);
    if (idx !== -1) {
      this.lru.splice(idx, 1);
    }
  }

  private enforceCacheSize() {
    while (this.lru.length > MAX_CACHE) {
      const old = this.lru.pop()!;
      this.storyCache.delete(old);
    }
  }
}
