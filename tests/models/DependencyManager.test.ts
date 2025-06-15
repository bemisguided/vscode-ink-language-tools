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
import { DependencyManager } from "../../src/model/DependencyManager";
import { DependencyNode } from "../../src/model/DependencyNode";

describe("DependencyManager", () => {
  function mockUri(path: string): vscode.Uri {
    return vscode.Uri.file(path);
  }

  beforeEach(() => {
    DependencyManager.getInstance().clearGraph();
  });

  it("setNode and getNode work as expected", () => {
    // Setup
    const manager = DependencyManager.getInstance();
    const uri = mockUri("/foo/bar.ink");
    const node = DependencyNode.fromUri(uri, 1);

    // Execute
    manager.setNode(uri, node);

    // Assert
    expect(manager.getNode(uri)).toBe(node);
  });

  it("deleteNode removes a node", () => {
    // Setup
    const manager = DependencyManager.getInstance();
    const uri = mockUri("/foo/bar.ink");
    const node = DependencyNode.fromUri(uri, 1);
    manager.setNode(uri, node);

    // Execute
    manager.deleteNode(uri);

    // Assert
    expect(manager.getNode(uri)).toBeUndefined();
  });

  it("getGraph returns the internal graph map", () => {
    // Setup
    const manager = DependencyManager.getInstance();
    const uri = mockUri("/foo/bar.ink");
    const node = DependencyNode.fromUri(uri, 1);
    manager.setNode(uri, node);

    // Execute
    const graph = manager.getGraph();

    // Assert
    expect(graph.get(uri)).toBe(node);
    expect(graph.size).toBe(1);
  });
});
