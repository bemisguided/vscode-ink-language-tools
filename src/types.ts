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

/*
  DEPRECATED: This file is no longer used.
*/

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
  /** Functions that can be bound to the story */
  bindableFunctions: BindableFunction[];
  /** Timestamp of when the compilation occurred */
  timestamp: number;
}

export interface FailedCompilationResult {
  success: false;
  sourceFileName: string;
  errors: CompilationError[];
  warnings: CompilationError[];
  /** Timestamp of when the compilation occurred */
  timestamp: number;
}

/**
 * Final result of the compilation pipeline
 */
export type CompilationResult =
  | SuccessfulCompilationResult
  | FailedCompilationResult;

export interface CompiledStory {
  story: Story;
  jsonOutput: string;
  bindableFunctions: BindableFunction[];
  timestamp: number;
}
