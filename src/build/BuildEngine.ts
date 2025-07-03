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
import { IPipelineProcessor } from "./IPipelineProcessor";
import { BuildResults } from "./BuildResults";
import { IBuildResult } from "./IBuildResult";
import { PipelineContext } from "./PipelineContext";
import { DependencyManager } from "../model/DependencyManager";
import { OutlinePreProcessor } from "./OutlinePreProcessor";
import { IncludePreProcessor } from "./IncludePreProcessor";
import { CompilationProcessor } from "./CompilationProcessor";
import { VSCodeServiceLocator } from "../services/VSCodeServiceLocator";
import { JsonOutputPostProcessor } from "./JsonOutputPostProcessor";
import { IPathResolutionStrategy } from "../util/paths/IPathResolutionStrategy";
import { InkyDefaultPathResolutionStrategy } from "../util/paths/InkyDefaultPathResolutionStrategy";
import { AdvancedPathResolutionStrategy } from "../util/paths/AdvancedPathResolutionStrategy";

/**
 * The build engine for the Ink language.
 */
export class BuildEngine {
  // Private Static Properties =========================================================================================

  private static instance: BuildEngine;

  // Public Static Methods ============================================================================================

  public static getInstance(): BuildEngine {
    if (!BuildEngine.instance) {
      BuildEngine.instance = new BuildEngine();
    }
    return BuildEngine.instance;
  }

  /**
   * Test-only method to clear the singleton instance.
   */
  public static clearInstance(): void {
    BuildEngine.instance = undefined!;
  }

  // Private Properties ===============================================================================================

  private processors: IPipelineProcessor[] = [];

  // Constructors =====================================================================================================

  private constructor() {
    this.registerProcessor(new OutlinePreProcessor());
    this.registerProcessor(new IncludePreProcessor());
    this.registerProcessor(new CompilationProcessor());
    this.registerProcessor(new JsonOutputPostProcessor());
  }

  // Private Methods ==================================================================================================

  /**
   * Create the appropriate path resolution strategy based on configuration.
   * @param uri The URI to get configuration for.
   * @returns The path resolution strategy to use.
   */
  private createPathResolutionStrategy(
    uri: vscode.Uri
  ): IPathResolutionStrategy {
    const configService = VSCodeServiceLocator.getConfigurationService();
    const useAdvancedResolution = configService.get<boolean>(
      "ink.compile.behaviour.advancedPathResolution",
      false,
      uri
    );

    return useAdvancedResolution
      ? new AdvancedPathResolutionStrategy()
      : new InkyDefaultPathResolutionStrategy();
  }

  /**
   * Flush the diagnostics to the diagnostics service.
   * @param context The context to flush the diagnostics from.
   */
  private flushDiagnostics(context: PipelineContext) {
    const diagnosticsService = VSCodeServiceLocator.getDiagnosticsService();

    // Reset all Diagnostics for the context and included documents
    const vscodeDiagnostics = new Map<vscode.Uri, vscode.Diagnostic[]>();
    vscodeDiagnostics.set(context.uri, []);
    context.includeDocuments.forEach((d) => {
      vscodeDiagnostics.set(d.uri, []);
    });

    // Build a map of URI to Diagnostic sets
    for (const d of context.getDiagnostics()) {
      const uri = d.uri;
      const diagnostics = vscodeDiagnostics.get(uri) || [];
      diagnostics.push(new vscode.Diagnostic(d.range, d.message, d.severity));
      vscodeDiagnostics.set(uri, diagnostics);
    }

    // Update VSCode Diagnostics Service, with the new diagnostics
    for (const [uri, diagnostics] of vscodeDiagnostics) {
      diagnosticsService.set(uri, diagnostics);
    }
  }
  /**
   * Register a pipeline processor.
   * @param processor The pipeline processor to register.
   */
  private registerProcessor(processor: IPipelineProcessor) {
    this.processors.push(processor);
  }

  /**
   * Run all pipeline processors on a single file.
   * @param uri The URI of the story to process.
   * @returns The compiled story, or undefined if the story has errors.
   */
  private async processFile(uri: vscode.Uri): Promise<PipelineContext> {
    const depManager = DependencyManager.getInstance();
    const docService = VSCodeServiceLocator.getDocumentService();

    try {
      const doc = await docService.getTextDocument(uri);
      depManager.createNode(uri, doc.version);

      // Execute the pipeline
      const pathStrategy = this.createPathResolutionStrategy(uri);
      const context = new PipelineContext(uri, doc, pathStrategy);
      for (const proc of this.processors) {
        await proc.run(context);
      }

      // Update the dependency graph with the results
      depManager.updateDependencies(context.getDependencies());

      // Flush the diagnostics to the diagnostics service
      this.flushDiagnostics(context);

      return context;
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      throw new Error(`Failed to process file ${uri.toString()}: ${message}`);
    }
  }

  private toBuildResult(context: PipelineContext): IBuildResult {
    if (context.story === undefined) {
      return {
        uri: context.uri,
        success: false,
        diagnostics: context.getDiagnostics(),
      };
    }
    return {
      uri: context.uri,
      story: context.story,
      success: true,
      diagnostics: context.getDiagnostics(),
    };
  }

  // Public Methods ===================================================================================================

  /**
   * Expose the diagnostics service for lifecycle management.
   */
  public get diagnostics() {
    return VSCodeServiceLocator.getDiagnosticsService();
  }

  /**
   * Compile an Ink story and return the compiled story and externals.
   * If the story is not in the dependency graph, it will be added.
   * If the story has errors, an error will be thrown.
   * If the story has included stories, they will be added to the dependency graph.
   * @param uri The URI of the story to compile.
   * @returns The compiled story and externals.
   */
  public async compileStory(uri: vscode.Uri): Promise<IBuildResult> {
    console.log("[BuildEngine] 🏗️ Compiling story:", uri.fsPath);
    const context = await this.processFile(uri);
    return this.toBuildResult(context);
  }

  /**
   * Recompile the changed file and all dependents, returning a map of each recompiled root story URI to its Story and externals.
   */
  public async recompileDependents(start: vscode.Uri): Promise<BuildResults> {
    console.log("[BuildEngine] 🏗️ Recompiling dependents:", start.fsPath);
    const depManager = DependencyManager.getInstance();
    const dependents = depManager.getAllDependents([start], true);
    const toRecompile = new Set([...dependents]);
    if (dependents.size === 0) {
      toRecompile.add(start);
    }

    const results: IBuildResult[] = [];

    for (const uri of toRecompile) {
      console.log("[BuildEngine] 🏗️ Recompiling story:", uri.fsPath);
      const context = await this.processFile(uri);
      results.push(this.toBuildResult(context));
    }

    return new BuildResults(results);
  }
}
