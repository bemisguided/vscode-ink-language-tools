import { PipelineContext } from "./PipelineContext";

/**
 * Result of a pipeline processor
 */
export interface PipelineResult {
  /** Whether to continue the pipeline */
  shouldContinue: boolean;
  /** Updated context */
  context: PipelineContext;
}

/**
 * Base class for all pipeline processors.
 * Provides common functionality and logging for processing Ink files.
 */
export abstract class BaseProcessor {
  // Private Properties ===============================================================================================

  protected readonly name: string;

  // Constructor ======================================================================================================

  constructor(name: string) {
    this.name = name;
  }

  // Public Methods ===================================================================================================

  /**
   * Processes the content of an Ink file.
   * @param context - The pipeline context containing the file content and metadata
   * @returns A pipeline result indicating success or failure
   */
  public abstract process(context: PipelineContext): Promise<PipelineResult>;

  /**
   * Logs a message with the processor's name prefix.
   * @param message - The message to log
   * @param type - Optional type of log message (default: "info")
   */
  protected logInfo(message: string): void {
    const prefix = `[${this.name}]`;
    console.log(prefix, message);
  }

  protected logError(message: string): void {
    const prefix = `[${this.name}]`;
    console.error(prefix, message);
  }

  /**
   * Creates a success result for the pipeline.
   * @param context - The pipeline context
   * @returns A pipeline result indicating success
   */
  protected createSuccessResult(context: PipelineContext): PipelineResult {
    return {
      shouldContinue: true,
      context,
    };
  }

  /**
   * Creates a failure result for the pipeline.
   * @param context - The pipeline context
   * @returns A pipeline result indicating failure
   */
  protected createFailureResult(context: PipelineContext): PipelineResult {
    return {
      shouldContinue: false,
      context,
    };
  }

  /**
   * Get the processor name
   */
  public getName(): string {
    return this.name;
  }

  // Protected Methods ================================================================================================

  /**
   * Check if the context has any errors
   */
  protected hasErrors(context: PipelineContext): boolean {
    return context.errors.length > 0;
  }
}
