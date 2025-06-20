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
import { DependencyNode } from "./DependencyNode";

/**
 * Singleton which manages the Dependency Graph.
 */
export class DependencyManager {
  // Private Static Properties ========================================================================================

  private static instance: DependencyManager;

  // Public Static Methods ============================================================================================

  public static getInstance(): DependencyManager {
    if (!DependencyManager.instance) {
      DependencyManager.instance = new DependencyManager();
    }
    return DependencyManager.instance;
  }

  // Private Properties ===============================================================================================

  private graph: Map<vscode.Uri, DependencyNode> = new Map();

  // Constructor ======================================================================================================

  private constructor() {}

  // Public Methods ===================================================================================================

  public getNode(uri: vscode.Uri): DependencyNode | undefined {
    return this.graph.get(uri);
  }

  public setNode(uri: vscode.Uri, node: DependencyNode): void {
    this.graph.set(uri, node);
  }

  public deleteNode(uri: vscode.Uri): void {
    this.graph.delete(uri);
  }

  public clearGraph(): void {
    this.graph.clear();
  }

  public getGraph(): Map<vscode.Uri, DependencyNode> {
    return this.graph;
  }

  public dumpGraph(): void {
    console.log("--- Dependency Graph ---");
    if (this.graph.size === 0) {
      console.log("Graph is empty.");
      console.log("------------------------");
      return;
    }

    for (const [uri, node] of this.graph.entries()) {
      console.log(`Node: ${uri.fsPath}`);
      console.log(`  Type: ${node.type}`);
      console.log(`  Version: ${node.version}`);

      if (node.deps.size > 0) {
        console.log("  Dependencies:");
        for (const dep of node.deps) {
          console.log(`    - ${dep.fsPath}`);
        }
      } else {
        console.log("  Dependencies: None");
      }

      if (node.revDeps.size > 0) {
        console.log("  Referenced by:");
        for (const revDep of node.revDeps) {
          console.log(`    - ${revDep.fsPath}`);
        }
      } else {
        console.log("  Referenced by: None");
      }
      console.log(""); // for spacing
    }
    console.log("------------------------");
  }
}
