import { ListParser } from "../../src/outline/ListParser";
import { OutlineParserContext } from "../../src/outline/OutlineParserContext";
import { SymbolType } from "../../src/model/OutlineEntity";

describe("ListParser", () => {
  let parser: ListParser;
  let context: OutlineParserContext;

  beforeEach(() => {
    parser = new ListParser();
    context = new OutlineParserContext();
  });

  it("parses a simple LIST line", () => {
    // Setup
    const line = "LIST fruits";

    // Execute
    const entity = parser.tryParse(line, 0, context);

    // Assert
    expect(entity).not.toBeNull();
    expect(entity!.name).toBe("fruits");
    expect(entity!.type).toBe(SymbolType.list);
    expect(entity!.children.length).toBe(0);
  });

  it("parses a LIST line with inline items", () => {
    // Setup
    const line = "LIST colors = red, green, blue";

    // Execute
    const entity = parser.tryParse(line, 1, context);

    // Assert
    expect(entity).not.toBeNull();
    expect(entity!.name).toBe("colors");
    expect(entity!.type).toBe(SymbolType.list);
    expect(entity!.children.length).toBe(3);
    expect(entity!.children.map((c) => c.name)).toEqual([
      "red",
      "green",
      "blue",
    ]);
    expect(entity!.children.every((c) => c.type === SymbolType.listItem)).toBe(
      true
    );
  });

  it("returns null for non-LIST lines", () => {
    // Setup
    const line = "VAR x = 1";

    // Execute
    const entity = parser.tryParse(line, 0, context);

    // Assert
    expect(entity).toBeNull();
  });

  it("parses a LIST line with default values for items", () => {
    // Setup
    const line = "LIST animals = cat, (dog), (mouse)";

    // Execute
    const entity = parser.tryParse(line, 2, context);

    // Assert
    expect(entity).not.toBeNull();
    expect(entity!.name).toBe("animals");
    expect(entity!.type).toBe(SymbolType.list);
    expect(entity!.children.length).toBe(3);
    expect(entity!.children.map((c) => c.name)).toEqual([
      "cat",
      "(dog)",
      "(mouse)",
    ]);
    // By default, no explicit value assignment, just names
  });

  it("parses a LIST line with explicit values assigned to items", () => {
    // Setup
    const line = "LIST points = gold=10, silver=5, bronze=1";

    // Execute
    const entity = parser.tryParse(line, 3, context);

    // Assert
    expect(entity).not.toBeNull();
    expect(entity!.name).toBe("points");
    expect(entity!.type).toBe(SymbolType.list);
    expect(entity!.children.length).toBe(3);
    expect(entity!.children.map((c) => c.name)).toEqual([
      "gold=10",
      "silver=5",
      "bronze=1",
    ]);
    // If the parser is later enhanced to split name/value, update this test
  });
});
