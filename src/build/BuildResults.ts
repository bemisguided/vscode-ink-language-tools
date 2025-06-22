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
import { IBuildResult } from "./IBuildResult";

/**
 * Represents a set of compilation results for one or more Ink Stories.
 */
export class BuildResults {
  // Private Properties ===============================================================================================

  private readonly results: Map<string, IBuildResult> = new Map();

  // Constructors =====================================================================================================

  constructor(results: IBuildResult[]) {
    for (const result of results) {
      this.results.set(result.uri.toString(), result);
    }
  }

  // Public Methods ===================================================================================================

  /**
   * Gets the compilation result for a given URI.
   * @param uri The URI of the story to get the result for.
   * @returns The compilation result for the story, or undefined if the story was not compiled.
   */
  public getResult(uri: vscode.Uri): IBuildResult {
    const result = this.results.get(uri.toString());
    if (!result) {
      throw new Error(`No build result found for ${uri.toString()}`);
    }
    return result;
  }

  /**
   * Gets all the compilation results.
   * @returns An array of all the compilation results.
   */
  public getResults(): IBuildResult[] {
    return Array.from(this.results.values());
  }

  /**
   * Checks if a compilation result exists for a given URI.
   * @param uri The URI of the story to check for.
   * @returns `true` if the story has a compilation result, otherwise `false`.
   */
  public hasResult(uri: vscode.Uri): boolean {
    return this.results.has(uri.toString());
  }
}
