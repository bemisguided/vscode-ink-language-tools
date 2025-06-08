import * as vscode from "vscode";
import {
  PipelineProcessor,
  CompilationResult,
  CreateContextOptions,
  CompilationErrorSeverity,
} from "./types";
import { PipelineContext } from "./PipelineContext";
import { MockProcessor } from "./MockProcessor";
import { IncludeProcessor } from "./IncludeProcessor";
import { CompileProcessor } from "./CompileProcessor";

/**
 * Manages the compilation pipeline for Ink files
 */
export class InkCompiler {
  // Private Properties ===============================================================================================

  private processors: PipelineProcessor[] = [];

  // Constructor ======================================================================================================

  constructor() {
    this.processors.push(new MockProcessor());
    this.processors.push(new IncludeProcessor());
    this.processors.push(new CompileProcessor());
  }

  // Public Methods ===================================================================================================

  /**
   * Execute the compilation pipeline
   */
  public async execute(
    options: CreateContextOptions
  ): Promise<CompilationResult> {
    // Initialize context
    const context = new PipelineContext(options);

    try {
      // Run pipeline
      for (const processor of this.processors) {
        const result = await processor.process(context);
        if (!result.shouldContinue) {
          break;
        }
      }

      // Convert pipeline result to compilation result
      return {
        success: context.errors.length === 0,
        story: context.metadata.get("story"),
        jsonOutput: context.metadata.get("jsonOutput"),
        errors: context.errors,
        warnings: context.warnings,
        includedFiles: context.metadata.get("includedFiles") || [],
        bindableFunctions: context.getBindableFunctions(),
      };
    } catch (error) {
      console.error("Pipeline execution failed:", error);
      return {
        success: false,
        errors: [
          {
            message: `Pipeline execution failed: ${
              error instanceof Error ? error.message : String(error)
            }`,
            file: options.filePath,
            line: 0,
            column: 0,
            severity: CompilationErrorSeverity.error,
          },
        ],
        warnings: [],
        includedFiles: [],
        bindableFunctions: [],
      };
    }
  }

  /**
   * Get the list of processors in the pipeline
   */
  public getProcessors(): PipelineProcessor[] {
    return [...this.processors];
  }

  /**
   * Clear all processors from the pipeline
   */
  public clearProcessors(): void {
    this.processors = [];
  }
}
