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
import { IPathResolutionStrategy } from "./IPathResolutionStrategy";

/**
 * Advanced path resolution strategy that supports both relative paths and workspace root paths.
 * This extends standard Ink behavior with VSCode-specific features.
 */
export class AdvancedPathResolutionStrategy implements IPathResolutionStrategy {
  // Private Properties ===============================================================================================

  private readonly sourceRootUri: vscode.Uri;

  // Constructor ======================================================================================================

  constructor(sourceRootUri: vscode.Uri) {
    this.sourceRootUri = sourceRootUri;
  }

  // Public Methods ===================================================================================================

  /**
   * @inheritdoc
   */
  public resolvePath(
    contextUri: vscode.Uri,
    path: string,
    parentUri?: vscode.Uri
  ): vscode.Uri | null {
    if (path.startsWith("/")) {
      // Absolute path relative to source root
      return vscode.Uri.joinPath(
        this.sourceRootUri,
        ...path.slice(1).split("/")
      );
    }
    // Relative path from the main story file (contextUri)
    // Note: parentUri is available for future strategies but not used here
    return vscode.Uri.joinPath(contextUri, "..", ...path.split("/"));
  }
}
