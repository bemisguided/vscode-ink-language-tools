import { CompilationError, BindableFunction } from "../types";
import { PipelineResult } from "./BaseProcessor";

/**
 * Context passed through the compilation pipeline
 */
export class PipelineContext {
  // Public Properties ===============================================================================================

  /** The main file being compiled */
  public readonly filePath: string;
  /** The current content being processed. */
  public content: string;
  /** Accumulated errors during processing */
  public errors: CompilationError[] = [];
  /** Accumulated warnings during processing */
  public warnings: CompilationError[] = [];
  /** Additional data shared between processors */
  public metadata: Map<string, any> = new Map();
  /** Functions that can be bound to the story */
  private bindableFunctions: BindableFunction[] = [];
  /** Files included in the compilation */
  private dependencies: string[] = [];

  // Constructor ======================================================================================================

  constructor(options: { filePath: string; content: string; debug?: boolean }) {
    this.filePath = options.filePath;
    this.content = options.content;
  }

  // Public Methods ===================================================================================================

  /**
   * Add an error to the context
   */
  public addError(error: CompilationError): void {
    this.errors.push(error);
  }

  /**
   * Add a warning to the context
   */
  public addWarning(warning: CompilationError): void {
    this.warnings.push(warning);
  }

  /**
   * Add a bindable function to the context
   */
  public addBindableFunction(func: BindableFunction): void {
    this.bindableFunctions.push(func);
  }

  /**
   * Get all bindable functions
   */
  public getBindableFunctions(): BindableFunction[] {
    return this.bindableFunctions;
  }

  /**
   * Add a dependency to the context
   */
  public addDependency(dependency: string): void {
    this.dependencies.push(dependency);
  }

  /**
   * Get all dependencies
   */
  public getDependencies(): string[] {
    return this.dependencies;
  }

  /**
   * Create a success result
   */
  public createSuccessResult(): PipelineResult {
    return {
      shouldContinue: true,
      context: this,
    };
  }

  /**
   * Create a failure result
   */
  public createFailureResult(): PipelineResult {
    return {
      shouldContinue: false,
      context: this,
    };
  }

  /**
   * Check if there are any errors
   */
  public hasErrors(): boolean {
    return this.errors.length > 0;
  }
}
