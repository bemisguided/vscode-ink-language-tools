import { IncludeParser } from "../../src/outline/IncludeParser";
import { OutlineParserContext } from "../../src/outline/OutlineParserContext";
import { SymbolType } from "../../src/dependencies/OutlineEntity";

describe("IncludeParser", () => {
  it("parses a standard INCLUDE line", () => {
    const parser = new IncludeParser();
    const context = new OutlineParserContext();
    const line = "INCLUDE myfile.ink";
    const entity = parser.tryParse(line, 1, context);
    expect(entity).not.toBeNull();
    expect(entity!.name).toBe("myfile.ink");
    expect(entity!.type).toBe(SymbolType.include);
    expect(entity!.definitionLine).toBe(1);
  });

  it("parses an INCLUDE line with extra whitespace", () => {
    const parser = new IncludeParser();
    const context = new OutlineParserContext();
    const line = "  INCLUDE    another_file.ink   ";
    const entity = parser.tryParse(line, 4, context);
    expect(entity).not.toBeNull();
    expect(entity!.name).toBe("another_file.ink");
    expect(entity!.type).toBe(SymbolType.include);
    expect(entity!.definitionLine).toBe(4);
  });

  it("parses an INCLUDE line with slashes in the path", () => {
    const parser = new IncludeParser();
    const context = new OutlineParserContext();
    const line = "INCLUDE path/to/file.ink";
    const entity = parser.tryParse(line, 2, context);
    expect(entity).not.toBeNull();
    expect(entity!.name).toBe("path/to/file.ink");
    expect(entity!.type).toBe(SymbolType.include);
  });

  it("parses an INCLUDE line with dots in the path", () => {
    const parser = new IncludeParser();
    const context = new OutlineParserContext();
    const line = "INCLUDE ../relative/other.ink";
    const entity = parser.tryParse(line, 3, context);
    expect(entity).not.toBeNull();
    expect(entity!.name).toBe("../relative/other.ink");
    expect(entity!.type).toBe(SymbolType.include);
  });

  it("parses an INCLUDE line with an absolute path", () => {
    const parser = new IncludeParser();
    const context = new OutlineParserContext();
    const line = "INCLUDE /absolute/path/to/file.ink";
    const entity = parser.tryParse(line, 5, context);
    expect(entity).not.toBeNull();
    expect(entity!.name).toBe("/absolute/path/to/file.ink");
    expect(entity!.type).toBe(SymbolType.include);
  });

  it("returns null for non-INCLUDE lines", () => {
    const parser = new IncludeParser();
    const context = new OutlineParserContext();
    const line = "VAR something = 5";
    expect(parser.tryParse(line, 0, context)).toBeNull();
  });
});
