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

import { OutlineParser } from "../../../src/build/outline/OutlineParser";
import { SymbolType } from "../../../src/model/OutlineEntity";
import * as vscode from "vscode";

describe("OutlineParser", () => {
  let parser: OutlineParser;

  beforeEach(() => {
    parser = new OutlineParser();
  });

  function createMockDocument(lines: string[]): vscode.TextDocument {
    return {
      getText: () => lines.join("\n"),
    } as unknown as vscode.TextDocument;
  }

  it("parses knots and stitches as root and nested entities", async () => {
    const lines = [
      "== knotA",
      "= stitchA",
      "= stitchB",
      "== knotB",
      "= stitchC",
    ];
    const doc = createMockDocument(lines);
    const outline = await parser.parse(doc);
    expect(outline.length).toBe(2);
    expect(outline[0].name).toBe("knotA");
    expect(outline[0].type).toBe(SymbolType.knot);
    expect(outline[0].children.length).toBe(2);
    expect(outline[0].children[0].name).toBe("stitchA");
    expect(outline[0].children[1].name).toBe("stitchB");
    expect(outline[1].name).toBe("knotB");
    expect(outline[1].type).toBe(SymbolType.knot);
    expect(outline[1].children.length).toBe(1);
    expect(outline[1].children[0].name).toBe("stitchC");
  });

  it("parses lists, variables, and consts as root entities", async () => {
    const lines = [
      "LIST myList = a, b, c",
      "VAR score = 10",
      "CONST maxScore = 100",
    ];
    const doc = createMockDocument(lines);
    const outline = await parser.parse(doc);
    expect(outline.length).toBe(3);
    expect(outline[0].name).toBe("myList");
    expect(outline[0].type).toBe(SymbolType.list);
    expect(outline[1].name).toBe("score");
    expect(outline[1].type).toBe(SymbolType.variable);
    expect(outline[2].name).toBe("maxScore");
    expect(outline[2].type).toBe(SymbolType.const);
  });

  it("parses EXTERNAL and INCLUDE as root entities", async () => {
    const lines = ["EXTERNAL myFunc(x, y)", "INCLUDE file.ink"];
    const doc = createMockDocument(lines);
    const outline = await parser.parse(doc);
    expect(outline.length).toBe(2);
    expect(outline[0].name).toBe("myFunc(x, y)");
    expect(outline[0].type).toBe(SymbolType.external);
    expect(outline[1].name).toBe("file.ink");
    expect(outline[1].type).toBe(SymbolType.include);
  });

  it("handles empty and comment lines gracefully", async () => {
    const lines = ["", "// This is a comment", "== knotA", "= stitchA"];
    const doc = createMockDocument(lines);
    const outline = await parser.parse(doc);
    expect(outline.length).toBe(1);
    expect(outline[0].name).toBe("knotA");
    expect(outline[0].children.length).toBe(1);
    expect(outline[0].children[0].name).toBe("stitchA");
  });

  it("parses nested structure with knots, stitches, and lists", async () => {
    const lines = [
      "== knotA",
      "= stitchA",
      "LIST myList = a, b, c",
      "= stitchB",
      "== knotB",
      "VAR score = 10",
    ];
    const doc = createMockDocument(lines);
    const outline = await parser.parse(doc);
    expect(outline.length).toBe(4);
    expect(outline[0].name).toBe("knotA");
    expect(outline[0].children[0].name).toBe("stitchA");
    expect(outline[0].children[1].name).toBe("stitchB");
    expect(outline[1].name).toBe("myList");
    expect(outline[2].name).toBe("knotB");
    expect(outline[3].name).toBe("score");
  });

  it("skips empty lines and comments", async () => {
    // Setup
    const doc = createMockDocument([
      "",
      "// This is a comment",
      "== knot1",
      "// Another comment",
      "VAR x = 1",
      "",
    ]);
    const parser = new OutlineParser();

    // Execute
    const entities = await parser.parse(doc);

    // Assert
    expect(
      entities.some((e) => e.type === SymbolType.knot && e.name === "knot1")
    ).toBe(true);
    // Check for variable as a child of the knot
    const knot = entities.find(
      (e) => e.type === SymbolType.knot && e.name === "knot1"
    );
    expect(knot).toBeDefined();
    expect(
      entities.some((c) => c.type === SymbolType.variable && c.name === "x")
    ).toBe(true);
    expect(entities.length).toBe(2);
  });

  it("delegates to the correct symbol parser for a knot line", async () => {
    // Setup
    const doc = createMockDocument(["== knotA"]);
    const parser = new OutlineParser();

    // Execute
    const entities = await parser.parse(doc);

    // Assert
    expect(entities.length).toBe(1);
    expect(entities[0].type).toBe(SymbolType.knot);
    expect(entities[0].name).toBe("knotA");
  });

  it("sets the correct scope range for knots", async () => {
    // Setup
    const doc = createMockDocument([
      "== knot1",
      "VAR x = 1",
      "== knot2",
      "VAR y = 2",
    ]);
    const parser = new OutlineParser();

    // Execute
    const entities = await parser.parse(doc);

    // Assert
    const knot1 = entities.find(
      (e) => e.type === SymbolType.knot && e.name === "knot1"
    );
    const knot2 = entities.find(
      (e) => e.type === SymbolType.knot && e.name === "knot2"
    );
    expect(knot1).toBeDefined();
    expect(knot2).toBeDefined();
    expect(knot1!.scopeRange.start.line).toBe(0);
    expect(knot1!.scopeRange.end.line).toBe(1);
    expect(knot2!.scopeRange.start.line).toBe(2);
    expect(knot2!.scopeRange.end.line).toBe(3);
  });

  it("does not parse multi-line lists (indented lines after LIST)", async () => {
    // Setup
    const doc = createMockDocument([
      "LIST fruits = apple, banana",
      "  orange",
      "  grape",
    ]);
    const parser = new OutlineParser();

    // Execute
    const entities = await parser.parse(doc);

    // Assert
    const list = entities.find(
      (e) => e.type === SymbolType.list && e.name === "fruits"
    );
    expect(list).toBeDefined();
    expect(list!.children.map((c) => c.name)).toEqual(["apple", "banana"]);
    // The indented lines should not be parsed as list items
    expect(
      entities.some(
        (e) =>
          e.type === SymbolType.listItem &&
          (e.name === "orange" || e.name === "grape")
      )
    ).toBe(false);
  });

  it("handles stacking rules for knots and stitches (root-level, consecutive, nested)", async () => {
    // Setup
    const doc = createMockDocument([
      "= rootStitch1",
      "= rootStitch2",
      "== knot1",
      "= stitchA",
      "= stitchB",
      "== knot2",
      "= stitchC",
      "VAR varGlobal = 1",
    ]);
    const parser = new OutlineParser();

    // Execute
    const entities = await parser.parse(doc);

    // Assert
    // Root-level stitches
    const rootStitch1 = entities.find(
      (e) => e.type === SymbolType.stitch && e.name === "rootStitch1"
    );
    const rootStitch2 = entities.find(
      (e) => e.type === SymbolType.stitch && e.name === "rootStitch2"
    );
    expect(rootStitch1).toBeDefined();
    expect(rootStitch2).toBeDefined();
    expect(
      entities.some(
        (e) => e.type === SymbolType.variable && e.name === "varGlobal"
      )
    ).toBe(true);

    // Knots and their children
    const knot1 = entities.find(
      (e) => e.type === SymbolType.knot && e.name === "knot1"
    );
    const knot2 = entities.find(
      (e) => e.type === SymbolType.knot && e.name === "knot2"
    );
    expect(knot1).toBeDefined();
    expect(knot2).toBeDefined();
    const stitchA = knot1!.children.find(
      (e) => e.type === SymbolType.stitch && e.name === "stitchA"
    );
    const stitchB = knot1!.children.find(
      (e) => e.type === SymbolType.stitch && e.name === "stitchB"
    );
    expect(stitchA).toBeDefined();
    expect(stitchB).toBeDefined();
    const stitchC = knot2!.children.find(
      (e) => e.type === SymbolType.stitch && e.name === "stitchC"
    );
    expect(stitchC).toBeDefined();

    // Ensure correct root entity order
    expect(entities.map((e) => e.name)).toEqual([
      "rootStitch1",
      "rootStitch2",
      "knot1",
      "knot2",
      "varGlobal",
    ]);
  });
});
