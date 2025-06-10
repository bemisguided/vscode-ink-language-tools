import * as vscode from "vscode";
import { CreateContextOptions, InkCompiler } from "./compiler/InkCompiler";
import { CompilationResult, CompiledStory } from "./types";

const MAX_CACHE_SIZE = 5;

export class InkStoryManager {
  private static instance: InkStoryManager;

  private readonly compiler: InkCompiler;
  private cache: Map<string, CompiledStory>;

  private constructor() {
    this.cache = new Map();
    this.compiler = new InkCompiler();
  }

  public static getInstance(): InkStoryManager {
    if (!InkStoryManager.instance) {
      InkStoryManager.instance = new InkStoryManager();
    }
    return InkStoryManager.instance;
  }

  public async compileStory(
    document: vscode.TextDocument,
    options: { debug: boolean } = { debug: false }
  ): Promise<CompilationResult> {
    const contextOptions: CreateContextOptions = {
      filePath: document.uri.fsPath,
      content: document.getText(),
      debug: options.debug,
    };
    const result = await this.compiler.compile(contextOptions);
    if (result.success) {
      const compiledStory: CompiledStory = {
        story: result.story,
        jsonOutput: result.jsonOutput,
        bindableFunctions: result.bindableFunctions,
        timestamp: Date.now(),
      };
      this.addToCache(document.uri.toString(), compiledStory);
    }
    return result;
  }

  public async getCompiledStory(
    document: vscode.TextDocument
  ): Promise<CompiledStory> {
    const key = document.uri.toString();
    const cached = this.cache.get(key);

    if (cached) {
      return cached;
    }

    const result = await this.compileStory(document);
    if (!result.success) {
      throw new Error("Failed to compile story");
    }

    const compiledStory: CompiledStory = {
      story: result.story,
      jsonOutput: result.jsonOutput,
      bindableFunctions: result.bindableFunctions,
      timestamp: Date.now(),
    };
    this.addToCache(key, compiledStory);
    return compiledStory;
  }

  private addToCache(key: string, result: CompiledStory): void {
    if (this.cache.size >= MAX_CACHE_SIZE) {
      const oldest = this.findOldestEntry();
      this.cache.delete(oldest);
    }
    this.cache.set(key, result);
  }

  private findOldestEntry(): string {
    let oldestKey = "";
    let oldestTime = Number.MAX_SAFE_INTEGER;

    for (const [key, value] of this.cache.entries()) {
      const time = value.timestamp;
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }

    return oldestKey;
  }
}
