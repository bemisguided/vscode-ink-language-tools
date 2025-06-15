import * as vscode from "vscode";
import { Story } from "inkjs";
import { PipelineProcessor } from "./PipelineProcessor";
import { CompiledStoryResult } from "./CompiledStoryResult";
import { PipelineContext } from "./PipelineContext";
import { DependencyManager } from "../model/DependencyManager";
import { DependencyNodeType } from "../model/DependencyNode";
import { DependencyNode } from "../model/DependencyNode";
import { OutlineProcessor } from "./outline/OutlineProcessor";
import { IncludeExtractionProcessor } from "./IncludeExtractionProcessor";
import { CompilationProcessor } from "./compiler/CompilationProcessor";

const MAX_CACHE = 2;

export class BuildEngine {
  private static instance: BuildEngine;
  private processors: PipelineProcessor[] = [];
  private diagnosticCollection: vscode.DiagnosticCollection;

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

  public registerProcessor(processor: PipelineProcessor) {
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

  /**
   * Dedupe and return compiled story for a root URI along with externals.
   */
  public async getCompiledStory(uri: vscode.Uri): Promise<CompiledStoryResult> {
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

    const ctx = new PipelineContext(uri, this.diagnosticCollection);
    ctx.resetDeps();
    for (const proc of this.processors) {
      await proc.run(ctx);
      try {
        const updated = await vscode.workspace.openTextDocument(uri);
        DependencyManager.getInstance().getNode(uri)!.version = updated.version;
      } catch {}
    }
    ctx.flushDiagnostics();
    return ctx.compiledStory;
  }

  /**
   * On file change, re-run pipeline for changed file and all dependents.
   * Returns a map of each recompiled root story URI to its Story and externals.
   */
  public async onFileChanged(
    start: vscode.Uri
  ): Promise<Map<vscode.Uri, CompiledStoryResult>> {
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
