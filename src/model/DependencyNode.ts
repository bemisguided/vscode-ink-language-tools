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

/**
 * Identifies the type of DependencyNode.
 */
export enum DependencyNodeType {
  story = "story",
  externalFunctions = "externalFunctions",
}

/**
 * Represents a node in the Dependency Graph.
 */
export class DependencyNode {
  // Public Properties ===============================================================================================

  /**
   * Unique identifier for the file.
   */
  public uri: vscode.Uri;

  /**
   * Document version or file modification time.
   */
  public version: number;

  /**
   * The type of dependency node (e.g., story, externalFunctions).
   */
  public type: DependencyNodeType;

  /**
   * Dependencies (INCLUDES & MOCKS).
   */
  public deps: Set<vscode.Uri> = new Set();

  /**
   * Reverse dependencies (who depends on this node).
   */
  public revDeps: Set<vscode.Uri> = new Set();

  // Constructor ======================================================================================================

  constructor(uri: vscode.Uri, version: number, type: DependencyNodeType) {
    this.uri = uri;
    this.version = version;
    this.type = type;
  }

  // Public Methods ===================================================================================================

  public addDep(dep: vscode.Uri): void {
    this.deps.add(dep);
  }

  public removeDep(dep: vscode.Uri): void {
    this.deps.delete(dep);
  }

  static fromUri(uri: vscode.Uri, version: number = 0): DependencyNode {
    if (uri.path.endsWith(".ink")) {
      return new DependencyNode(uri, version, DependencyNodeType.story);
    }
    if (uri.path.endsWith(".js")) {
      return new DependencyNode(
        uri,
        version,
        DependencyNodeType.externalFunctions
      );
    }
    throw new Error(`Unsupported file type: ${uri.path}`);
  }
}
