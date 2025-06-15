import { OutlineParser } from "../../../src/build/outline/OutlineParser";
import { SymbolType } from "../../../src/model/OutlineEntity";
import * as vscode from "vscode";

describe("OutlineParser", () => {
  function createMockDocument(lines: string[]): vscode.TextDocument {
    return {
      getText: () => lines.join("\n"),
    } as unknown as vscode.TextDocument;
  }

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
    expect(
      entities.some((e) => e.type === SymbolType.variable && e.name === "x")
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
});
