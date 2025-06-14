import * as vscode from "vscode";
import { OutlineEntity, SymbolType } from "../../src/model/OutlineEntity";

describe("OutlineEntity", () => {
  function mockRange(line = 0, char = 0) {
    return new vscode.Range(line, char, line, char + 5);
  }

  it("constructs with correct properties", () => {
    // Setup
    const entity = new OutlineEntity(
      "myKnot",
      SymbolType.knot,
      1,
      mockRange(1, 0),
      mockRange(1, 0)
    );

    // Assert
    expect(entity.name).toBe("myKnot");
    expect(entity.type).toBe(SymbolType.knot);
    expect(entity.definitionLine).toBe(1);
    expect(entity.definitionRange).toBeDefined();
    expect(entity.scopeRange).toBeDefined();
    expect(entity.parent).toBeUndefined();
    expect(entity.children).toEqual([]);
  });

  it("addChild adds a child and sets parent for allowed types", () => {
    // Setup
    const parent = new OutlineEntity(
      "parentKnot",
      SymbolType.knot,
      0,
      mockRange(0, 0),
      mockRange(0, 0)
    );
    const child = new OutlineEntity(
      "childStitch",
      SymbolType.stitch,
      1,
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
      SymbolType.variable,
      0,
      mockRange(0, 0),
      mockRange(0, 0)
    );
    const child = new OutlineEntity(
      "child",
      SymbolType.stitch,
      1,
      mockRange(1, 0),
      mockRange(1, 0)
    );

    // Execute & Assert
    expect(() => parent.addChild(child)).toThrow(
      "Entities of type 'variable' cannot have children."
    );
  });
});
