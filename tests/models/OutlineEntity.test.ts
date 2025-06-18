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
import { OutlineEntity, EntityType } from "../../src/model/OutlineEntity";

describe("OutlineEntity", () => {
  function mockRange(line = 0, char = 0) {
    return new vscode.Range(line, char, line, char + 5);
  }

  it("constructs with correct properties", () => {
    // Setup
    const entity = new OutlineEntity(
      "myKnot",
      EntityType.knot,
      mockRange(1, 0),
      mockRange(1, 0)
    );

    // Assert
    expect(entity.name).toBe("myKnot");
    expect(entity.type).toBe(EntityType.knot);
    expect(entity.definitionRange.start.line).toBe(1);
    expect(entity.definitionRange).toBeDefined();
    expect(entity.scopeRange).toBeDefined();
    expect(entity.parent).toBeUndefined();
    expect(entity.children).toEqual([]);
  });

  it("addChild adds a child and sets parent for allowed types", () => {
    // Setup
    const parent = new OutlineEntity(
      "parentKnot",
      EntityType.knot,
      mockRange(0, 0),
      mockRange(0, 0)
    );
    const child = new OutlineEntity(
      "childStitch",
      EntityType.stitch,
      mockRange(1, 0),
      mockRange(1, 0)
    );

    // Execute
    parent.addChild(child);

    // Assert
    expect(parent.children.length).toBe(1);
    expect(parent.children[0]).toBe(child);
    expect(child.parent).toBe(parent);
  });

  it("addChild throws for disallowed parent types", () => {
    // Setup
    const parent = new OutlineEntity(
      "myVar",
      EntityType.variable,
      mockRange(0, 0),
      mockRange(0, 0)
    );
    const child = new OutlineEntity(
      "child",
      EntityType.stitch,
      mockRange(1, 0),
      mockRange(1, 0)
    );

    // Execute & Assert
    expect(() => parent.addChild(child)).toThrow(
      "Entities of type 'variable' cannot have children."
    );
  });
});
