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
import { IBuildDiagnostic } from "./IBuildDiagnostic";

/**
 * Represents the result of a successful build.
 */
export interface ISuccessfulBuildResult {
  /**
   * The diagnostics for the build.
   */
  diagnostics: Readonly<IBuildDiagnostic[]>;

  /**
   * The compiled story.
   */
  story: Story;
  /**
   * The result is successful.
   */
  success: true;
  /**
   * The URI of the compiled story.
   */
  uri: vscode.Uri;
}

/**
 * Represents the result of a failed build.
 */
export interface IFailedBuildResult {
  /**
   * The diagnostics for the build.
   */
  diagnostics: Readonly<IBuildDiagnostic[]>;
  /**
   * The result is failed.
   */
  success: false;
  /**
   * The URI of the story that failed to build.
   */
  uri: vscode.Uri;
}

/**
 * Represents the compilation result of an Ink Story.
 */
export type IBuildResult = ISuccessfulBuildResult | IFailedBuildResult;
