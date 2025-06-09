import { Story } from "inkjs/engine/Story";

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
 * Types of errors that can occur during compilation
 */
export enum CompilationErrorSeverity {
  error = "ERROR",
  warning = "WARNING",
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

export interface SuccessfulCompilationResult {
  success: true;
  sourceFileName: string;
  /** The compiled story (if successful) */
  story: Story;
  /** The JSON output (if successful) */
  jsonOutput: string;
  /** Any errors that occurred */
  errors: CompilationError[];
  /** Any warnings that occurred */
  warnings: CompilationError[];
  /** Files included in the compilation */
  includedFiles: string[];
  /** Functions that can be bound to the story */
  bindableFunctions: BindableFunction[];
}

export interface FailedCompilationResult {
  success: false;
  sourceFileName: string;
  errors: CompilationError[];
  warnings: CompilationError[];
  includedFiles: string[];
  bindableFunctions: BindableFunction[];
}

/**
 * Final result of the compilation pipeline
 */
export type CompilationResult =
  | SuccessfulCompilationResult
  | FailedCompilationResult;
