import * as vscode from "vscode";
import { Story } from "inkjs/engine/Story";
import { PipelineContext } from "./PipelineContext";

/**
 * Types of errors that can occur during compilation
 */
export enum CompilationErrorSeverity {
  error = "ERROR",
  warning = "WARNING",
}

/**
 * Represents a function that can be bound to the story
 */
export interface BindableFunction {
  /** Name of the function */
  name: string;
  /** Function reference */
  fn: Function;
}

/**
 * Represents an error or warning during compilation
 */
export interface CompilationError {
  message: string;
  file: string;
  line: number;
  column: number;
  severity: CompilationErrorSeverity;
  source?: string;
}

/**
 * Options for creating a pipeline context
 */
export interface CreateContextOptions {
  filePath: string;
  content: string;
  debug?: boolean;
}

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
 * Interface for pipeline processors
 */
export interface PipelineProcessor {
  /**
   * Process the current context
   * @param context The current pipeline context
   * @returns A result indicating whether to continue and the updated context
   */
  process(context: PipelineContext): Promise<PipelineResult>;
}

/**
 * Final result of the compilation pipeline
 */
export interface CompilationResult {
  /** Whether compilation was successful */
  success: boolean;
  /** The compiled story (if successful) */
  story?: Story;
  /** The JSON output (if successful) */
  jsonOutput?: string;
  /** Any errors that occurred */
  errors: CompilationError[];
  /** Any warnings that occurred */
  warnings: CompilationError[];
  /** Files included in the compilation */
  includedFiles: string[];
  /** Functions that can be bound to the story */
  bindableFunctions: BindableFunction[];
}
