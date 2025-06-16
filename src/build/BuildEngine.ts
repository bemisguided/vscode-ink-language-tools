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
import { VSCodeServiceLocator } from "../services/VSCodeServiceLocator";

/**
 * The build engine for the Ink language.
 */
export class BuildEngine {
  // Private Properties ===============================================================================================

  private static instance: BuildEngine;
  private processors: IPipelineProcessor[] = [];

  private constructor() {
    this.registerProcessor(new OutlineProcessor());
    this.registerProcessor(new IncludeExtractionProcessor());
    this.registerProcessor(new CompilationProcessor());
  }

  public static getInstance(): BuildEngine {
    if (!BuildEngine.instance) {
      BuildEngine.instance = new BuildEngine();
    }
    return BuildEngine.instance;
  }

  /**
   * Expose the diagnostics service for lifecycle management.
   */
  public get diagnostics() {
    return VSCodeServiceLocator.getDiagnosticsService();
  }

  /**
   * Compile a root Ink story and return the compiled story and externals.
   * Always recompiles (no cache).
   */
  public async compileStory(uri: vscode.Uri): Promise<ICompiledStoryResult> {
    const node = DependencyManager.getInstance().getNode(uri);
    if (!node) {
      throw new Error(`URI not in graph: ${uri.fsPath}`);
    }
    const compiled = await this.processFile(uri);
    if (!compiled) {
      throw new Error(`Failed to compile story: ${uri.fsPath}`);
    }
    const externals = Array.from(node.deps).filter(
      (d) =>
        DependencyManager.getInstance().getNode(d)?.type ===
        DependencyNodeType.externalFunctions
    );
    return { story: compiled, externals };
  }

  /**
   * Recompile the changed file and all dependents, returning a map of each recompiled root story URI to its Story and externals.
   */
  public async recompileDependents(
    start: vscode.Uri
  ): Promise<Map<vscode.Uri, ICompiledStoryResult>> {
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

  // Private pipeline processor registration
  private registerProcessor(processor: IPipelineProcessor) {
    this.processors.push(processor);
  }

  // Private method to run all pipeline processors on a single file
  private async processFile(uri: vscode.Uri): Promise<Story | undefined> {
    const depManager = DependencyManager.getInstance();
    if (!depManager.getNode(uri)) {
      depManager.setNode(uri, DependencyNode.fromUri(uri, 0));
    }
    const docService = VSCodeServiceLocator.getDocumentService();
    try {
      const doc = await docService.getTextDocument(uri);
      DependencyManager.getInstance().getNode(uri)!.version = doc.version;
    } catch {}

    const diagnosticsService = VSCodeServiceLocator.getDiagnosticsService();
    const context = new PipelineContext(uri, diagnosticsService, docService);
    context.resetDeps();
    for (const proc of this.processors) {
      await proc.run(context);
      try {
        const updated = await docService.getTextDocument(uri);
        DependencyManager.getInstance().getNode(uri)!.version = updated.version;
      } catch {}
    }
    context.flushDiagnostics();
    return context.compiledStory;
  }
}
