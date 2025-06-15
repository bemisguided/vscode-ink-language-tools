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

import { StitchParser } from "../../../src/build/outline/StitchParser";
import { OutlineParserContext } from "../../../src/build/outline/OutlineParserContext";
import { SymbolType, OutlineEntity } from "../../../src/model/OutlineEntity";
import * as vscode from "vscode";

describe("StitchParser", () => {
  let parser: StitchParser;
  let context: OutlineParserContext;

  beforeEach(() => {
    parser = new StitchParser();
    context = new OutlineParserContext();
  });

  it("parses a standard stitch line", () => {
    // Setup
    const line = "= myStitch";

    // Execute
    const entity = parser.tryParse(line, 0, context);

    // Assert
    expect(entity).not.toBeNull();
    expect(entity!.name).toBe("myStitch");
    expect(entity!.type).toBe(SymbolType.stitch);
    expect(entity!.definitionLine).toBe(0);
  });

  it("parses a stitch line with parameters", () => {
    // Setup
    const line = "= myStitch(x, y)";

    // Execute
    const entity = parser.tryParse(line, 1, context);

    // Assert
    expect(entity).not.toBeNull();
    expect(entity!.name).toBe("myStitch(x, y)");
    expect(entity!.type).toBe(SymbolType.stitch);
    expect(entity!.definitionLine).toBe(1);
  });

  it("parses a stitch line with extra whitespace", () => {
    // Setup
    const line = "=   spacedStitch   ( a, b )   ";

    // Execute
    const entity = parser.tryParse(line, 2, context);

    // Assert
    expect(entity).not.toBeNull();
    expect(entity!.name).toBe("spacedStitch( a, b )");
    expect(entity!.type).toBe(SymbolType.stitch);
    expect(entity!.definitionLine).toBe(2);
  });

  it("returns null and adds to currentKnot if set in context", () => {
    // Setup
    const knot = new OutlineEntity(
      "parentKnot",
      SymbolType.knot,
      0,
      new vscode.Range(0, 0, 0, 10),
      new vscode.Range(0, 0, 0, 10)
    );
    context.currentKnot = knot;
    const line = "= childStitch";

    // Execute
    const entity = parser.tryParse(line, 3, context);

    // Assert
    expect(entity).toBeNull();
    expect(knot.children.length).toBe(1);
    expect(knot.children[0].name).toBe("childStitch");
    expect(knot.children[0].type).toBe(SymbolType.stitch);
  });

  it("returns null for non-stitch lines", () => {
    // Setup
    const line = "VAR x = 1";

    // Execute
    const entity = parser.tryParse(line, 4, context);

    // Assert
    expect(entity).toBeNull();
  });
});
