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
import { OutlineParser } from "../../../src/build/outline/OutlineParser";
import { EntityType } from "../../../src/model/OutlineEntity";
import { OutlineEntity } from "../../../src/model/OutlineEntity";

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

  interface OutlineEntityExpectation {
    type: EntityType;
    name: string;
    definition?: { line: number };
    scope?: { start: number; end: number };
    isBlock?: boolean;
    parent?: { name: string; type: EntityType };
  }

  function expectOutlineEntity(
    entity: OutlineEntity,
    { type, name, definition, scope, isBlock, parent }: OutlineEntityExpectation
  ) {
    expect(entity.type).toBe(type);
    expect(entity.name).toBe(name);
    if (definition) {
      expect(entity.definitionRange.start.line).toBe(definition.line);
    }
    if (scope) {
      expect(entity.scopeRange.start.line).toBe(scope.start);
      expect(entity.scopeRange.end.line).toBe(scope.end);
    }
    if (typeof isBlock === "boolean") {
      expect(entity.isBlock).toBe(isBlock);
    }
    if (parent) {
      expect(entity.parent).toBeDefined();
      expect(entity.parent!.name).toBe(parent.name);
      expect(entity.parent!.type).toBe(parent.type);
    }
  }

  it("parses root-level knots and nested stitches with correct properties", async () => {
    // Setup
    const lines = [
      "== knotA", // 0
      "Hello,", // 1
      "= stitchA", // 2
      "is", // 3
      "= stitchB", // 4
      "me", // 5
      "== knotB", // 6
      "you're", // 7
      "= stitchC", // 8
      "looking for?", // 9
    ];
    const doc = createMockDocument(lines);

    // Execute
    const outline = await parser.parse(doc);

    // Assert
    expect(outline.length).toBe(2);
    expectOutlineEntity(outline[0], {
      type: EntityType.knot,
      name: "knotA",
      definition: { line: 0 },
      scope: { start: 0, end: 5 },
      isBlock: true,
    });
    expectOutlineEntity(outline[0].children[0], {
      type: EntityType.stitch,
      name: "stitchA",
      definition: { line: 2 },
      scope: { start: 2, end: 3 },
      isBlock: true,
      parent: { name: "knotA", type: EntityType.knot },
    });
    expectOutlineEntity(outline[0].children[1], {
      type: EntityType.stitch,
      name: "stitchB",
      definition: { line: 4 },
      scope: { start: 4, end: 5 },
      isBlock: true,
      parent: { name: "knotA", type: EntityType.knot },
    });
    expectOutlineEntity(outline[1], {
      type: EntityType.knot,
      name: "knotB",
      definition: { line: 6 },
      scope: { start: 6, end: 9 },
      isBlock: true,
    });
    expectOutlineEntity(outline[1].children[0], {
      type: EntityType.stitch,
      name: "stitchC",
      definition: { line: 8 },
      scope: { start: 8, end: 9 },
      isBlock: true,
      parent: { name: "knotB", type: EntityType.knot },
    });
  });

  it("parses root-level lists, variables, and consts", async () => {
    // Setup
    const lines = [
      "LIST myList = a, b, c",
      "VAR score = 10",
      "CONST maxScore = 100",
    ];
    const doc = createMockDocument(lines);

    // Execute
    const outline = await parser.parse(doc);

    // Assert
    expect(outline.length).toBe(3);
    expectOutlineEntity(outline[0], {
      type: EntityType.list,
      name: "myList",
      definition: { line: 0 },
      isBlock: false,
    });
    expectOutlineEntity(outline[1], {
      type: EntityType.variable,
      name: "score",
      definition: { line: 1 },
      isBlock: false,
    });
    expectOutlineEntity(outline[2], {
      type: EntityType.const,
      name: "maxScore",
      definition: { line: 2 },
      isBlock: false,
    });
  });

  it("parses EXTERNAL and INCLUDE as root entities with correct properties", async () => {
    // Setup
    const lines = ["EXTERNAL myFunc(x, y)", "INCLUDE file.ink"];
    const doc = createMockDocument(lines);

    // Execute
    const outline = await parser.parse(doc);

    // Assert
    expect(outline.length).toBe(2);
    expectOutlineEntity(outline[0], {
      type: EntityType.external,
      name: "myFunc(x, y)",
      definition: { line: 0 },
      isBlock: false,
    });
    expectOutlineEntity(outline[1], {
      type: EntityType.include,
      name: "file.ink",
      definition: { line: 1 },
      isBlock: false,
    });
  });

  it("skips empty lines and comments and parses valid entities only", async () => {
    // Setup
    const doc = createMockDocument([
      "",
      "// This is a comment",
      "== knot1",
      "// Another comment",
      "VAR x = 1",
      "",
    ]);

    // Execute
    const entities = await parser.parse(doc);

    // Assert
    expect(entities.length).toBe(2);
    expectOutlineEntity(entities[0], {
      type: EntityType.knot,
      name: "knot1",
      definition: { line: 2 },
      isBlock: true,
    });
    expectOutlineEntity(entities[1], {
      type: EntityType.variable,
      name: "x",
      definition: { line: 4 },
      isBlock: false,
    });
  });

  it("parses nested structure with knots, stitches, and lists", async () => {
    // Setup
    const lines = [
      "== knotA",
      "= stitchA",
      "LIST myList = a, b, c",
      "= stitchB",
      "== knotB",
      "VAR score = 10",
    ];
    const doc = createMockDocument(lines);

    // Execute
    const outline = await parser.parse(doc);

    // Assert
    expect(outline.length).toBe(4);
    expectOutlineEntity(outline[0], {
      type: EntityType.knot,
      name: "knotA",
      definition: { line: 0 },
      isBlock: true,
    });
    expectOutlineEntity(outline[0].children[0], {
      type: EntityType.stitch,
      name: "stitchA",
      definition: { line: 1 },
      isBlock: true,
      parent: { name: "knotA", type: EntityType.knot },
    });
    expectOutlineEntity(outline[0].children[1], {
      type: EntityType.stitch,
      name: "stitchB",
      definition: { line: 3 },
      isBlock: true,
      parent: { name: "knotA", type: EntityType.knot },
    });
    expectOutlineEntity(outline[1], {
      type: EntityType.list,
      name: "myList",
      definition: { line: 2 },
      isBlock: false,
    });
    expectOutlineEntity(outline[2], {
      type: EntityType.knot,
      name: "knotB",
      definition: { line: 4 },
      isBlock: true,
    });
    expectOutlineEntity(outline[3], {
      type: EntityType.variable,
      name: "score",
      definition: { line: 5 },
      isBlock: false,
    });
  });

  it("parses a single knot as a root entity", async () => {
    // Setup
    const doc = createMockDocument(["== knotA"]);

    // Execute
    const entities = await parser.parse(doc);

    // Assert
    expect(entities.length).toBe(1);
    expectOutlineEntity(entities[0], {
      type: EntityType.knot,
      name: "knotA",
      definition: { line: 0 },
      isBlock: true,
    });
  });

  it("parses knots with correct scope range", async () => {
    // Setup
    const doc = createMockDocument([
      "== knot1",
      "VAR x = 1",
      "== knot2",
      "VAR y = 2",
    ]);

    // Execute
    const entities = await parser.parse(doc);

    // Assert
    expectOutlineEntity(entities[0], {
      type: EntityType.knot,
      name: "knot1",
      definition: { line: 0 },
      scope: { start: 0, end: 1 },
      isBlock: true,
    });
    expectOutlineEntity(entities[2], {
      type: EntityType.knot,
      name: "knot2",
      definition: { line: 2 },
      scope: { start: 2, end: 3 },
      isBlock: true,
    });
  });

  it("parses root-level and nested block entities with correct parent/child relationships", async () => {
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

    // Execute
    const entities = await parser.parse(doc);

    // Assert
    expectOutlineEntity(entities[0], {
      type: EntityType.stitch,
      name: "rootStitch1",
      definition: { line: 0 },
      isBlock: true,
    });
    expectOutlineEntity(entities[1], {
      type: EntityType.stitch,
      name: "rootStitch2",
      definition: { line: 1 },
      isBlock: true,
    });
    expectOutlineEntity(entities[2], {
      type: EntityType.knot,
      name: "knot1",
      definition: { line: 2 },
      isBlock: true,
    });
    expectOutlineEntity(entities[2].children[0], {
      type: EntityType.stitch,
      name: "stitchA",
      definition: { line: 3 },
      isBlock: true,
      parent: { name: "knot1", type: EntityType.knot },
    });
    expectOutlineEntity(entities[2].children[1], {
      type: EntityType.stitch,
      name: "stitchB",
      definition: { line: 4 },
      isBlock: true,
      parent: { name: "knot1", type: EntityType.knot },
    });
    expectOutlineEntity(entities[3], {
      type: EntityType.knot,
      name: "knot2",
      definition: { line: 5 },
      isBlock: true,
    });
    expectOutlineEntity(entities[3].children[0], {
      type: EntityType.stitch,
      name: "stitchC",
      definition: { line: 6 },
      isBlock: true,
      parent: { name: "knot2", type: EntityType.knot },
    });
    expectOutlineEntity(entities[4], {
      type: EntityType.variable,
      name: "varGlobal",
      definition: { line: 7 },
      isBlock: false,
    });
  });

  it("parses interleaved knots, functions, and other root entities with correct scope and definition", async () => {
    // Setup
    const lines = [
      "// Start of file", // 0
      "== knotA", // 1
      "", // 2
      "// Function after knotA", // 3
      "== function funcA(x)", // 4
      "", // 5
      "== knotB", // 6
      "// Another function", // 7
      "== function funcB()", // 8
      "", // 9
      "== knotC", // 10
      "// End of file", // 11
    ];
    const doc = createMockDocument(lines);

    // Execute
    const outline = await parser.parse(doc);

    // Assert
    expect(outline.length).toBe(5);
    expectOutlineEntity(outline[0], {
      type: EntityType.knot,
      name: "knotA",
      definition: { line: 1 },
      scope: { start: 1, end: 3 },
      isBlock: true,
    });
    expectOutlineEntity(outline[1], {
      type: EntityType.function,
      name: "funcA(x)",
      definition: { line: 4 },
      scope: { start: 4, end: 5 },
      isBlock: true,
    });
    expectOutlineEntity(outline[2], {
      type: EntityType.knot,
      name: "knotB",
      definition: { line: 6 },
      scope: { start: 6, end: 7 },
      isBlock: true,
    });
    expectOutlineEntity(outline[3], {
      type: EntityType.function,
      name: "funcB()",
      definition: { line: 8 },
      scope: { start: 8, end: 9 },
      isBlock: true,
    });
    expectOutlineEntity(outline[4], {
      type: EntityType.knot,
      name: "knotC",
      definition: { line: 10 },
      scope: { start: 10, end: 11 },
      isBlock: true,
    });
    for (const entity of outline) {
      expect(entity.children.length).toBe(0);
    }
  });
});
