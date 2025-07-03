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
 * Standard Ink path resolution strategy that only supports relative paths.
 * This follows the default Ink behavior and rejects absolute paths (starting with /).
 */
export class InkyDefaultPathResolutionStrategy
  implements IPathResolutionStrategy
{
  /**
   * @inheritdoc
   */
  public resolvePath(context: vscode.Uri, path: string): vscode.Uri | null {
    // Reject absolute paths - not supported in standard Ink
    if (path.startsWith("/")) {
      return null;
    }

    // Resolve relative paths from the context file's directory
    return vscode.Uri.joinPath(context, "..", ...path.split("/"));
  }
}
