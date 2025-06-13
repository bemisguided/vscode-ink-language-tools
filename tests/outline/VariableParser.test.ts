import { VariableParser } from "../../src/outline/VariableParser";
import { OutlineParserContext } from "../../src/outline/OutlineParserContext";
import { SymbolType } from "../../src/dependencies/OutlineEntity";

describe("VariableParser", () => {
  it("parses a standard VAR line", () => {
    const parser = new VariableParser();
    const context = new OutlineParserContext();
    const line = "VAR myVar = 10";
    const entity = parser.tryParse(line, 0, context);
    expect(entity).not.toBeNull();
    expect(entity!.name).toBe("myVar");
    expect(entity!.type).toBe(SymbolType.variable);
    expect(entity!.definitionLine).toBe(0);
  });

  it("parses a VAR line with extra whitespace", () => {
    const parser = new VariableParser();
    const context = new OutlineParserContext();
    const line = "  VAR    spacedVar   =   42  ";
    const entity = parser.tryParse(line, 7, context);
    expect(entity).not.toBeNull();
    expect(entity!.name).toBe("spacedVar");
    expect(entity!.type).toBe(SymbolType.variable);
    expect(entity!.definitionLine).toBe(7);
  });

  it("returns null for non-VAR lines", () => {
    const parser = new VariableParser();
    const context = new OutlineParserContext();
    const line = "INCLUDE file.ink";
    expect(parser.tryParse(line, 0, context)).toBeNull();
  });
});
