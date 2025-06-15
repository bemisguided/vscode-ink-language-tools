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
import {
  DependencyNode,
  DependencyNodeType,
} from "../../src/model/DependencyNode";

describe("DependencyNode", () => {
  function mockUri(path: string): vscode.Uri {
    return vscode.Uri.file(path);
  }

  it("constructs with correct properties", () => {
    // Setup
    const uri = mockUri("/foo/bar.ink");
    const node = new DependencyNode(uri, 42, DependencyNodeType.story);

    // Assert
    expect(node.uri).toBe(uri);
    expect(node.version).toBe(42);
    expect(node.type).toBe(DependencyNodeType.story);
    expect(node.deps.size).toBe(0);
    expect(node.revDeps.size).toBe(0);
  });

  it("addDep and removeDep work as expected", () => {
    // Setup
    const node = new DependencyNode(
      mockUri("/foo/bar.ink"),
      0,
      DependencyNodeType.story
    );
    const depUri = mockUri("/foo/dep.js");

    // Execute
    node.addDep(depUri);

    // Assert
    expect(node.deps.has(depUri)).toBe(true);

    // Execute
    node.removeDep(depUri);

    // Assert
    expect(node.deps.has(depUri)).toBe(false);
  });

  it("fromUri creates a story node for .ink files", () => {
    // Setup
    const uri = mockUri("/foo/bar.ink");

    // Execute
    const node = DependencyNode.fromUri(uri, 7);

    // Assert
    expect(node).toBeInstanceOf(DependencyNode);
    expect(node.type).toBe(DependencyNodeType.story);
    expect(node.version).toBe(7);
    expect(node.uri).toBe(uri);
  });

  it("fromUri creates an externalFunctions node for .js files", () => {
    // Setup
    const uri = mockUri("/foo/bar.js");

    // Execute
    const node = DependencyNode.fromUri(uri, 3);

    // Assert
    expect(node).toBeInstanceOf(DependencyNode);
    expect(node.type).toBe(DependencyNodeType.externalFunctions);
    expect(node.version).toBe(3);
    expect(node.uri).toBe(uri);
  });

  it("fromUri throws for unsupported file types", () => {
    // Setup
    const uri = mockUri("/foo/bar.txt");

    // Execute & Assert
    expect(() => DependencyNode.fromUri(uri)).toThrow(
      "Unsupported file type: /foo/bar.txt"
    );
  });
});
