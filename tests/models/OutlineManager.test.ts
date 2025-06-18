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
import { OutlineManager } from "../../src/model/OutlineManager";
import { OutlineEntity, EntityType } from "../../src/model/OutlineEntity";

describe("OutlineManager", () => {
  // Helper to create a mock Uri
  function mockUri(path: string): vscode.Uri {
    return vscode.Uri.file(path);
  }

  // Helper to create a mock OutlineEntity
  function mockEntity(name: string): OutlineEntity {
    // Use dummy ranges for testing
    const range = new vscode.Range(0, 0, 0, 1);
    return new OutlineEntity(name, EntityType.knot, range, range, false);
  }

  it("should set and get outlines for a URI", () => {
    // Setup
    const manager = OutlineManager.getInstance();
    const uri = mockUri("/fake/path.ink");
    const entities = [mockEntity("knot1"), mockEntity("knot2")];

    // Execute
    manager.setOutline(uri, entities);

    // Assert
    const result = manager.getOutline(uri);

    expect(result).toBeDefined();
    expect(result).toHaveLength(2);
    expect(result![0].name).toBe("knot1");
    expect(result![1].name).toBe("knot2");
  });

  it("should return undefined for URIs with no outline", () => {
    // Setup
    const manager = OutlineManager.getInstance();
    const uri = mockUri("/no/outline.ink");

    // Execute
    const result = manager.getOutline(uri);

    // Assert
    expect(manager.getOutline(uri)).toBeUndefined();
  });
});
