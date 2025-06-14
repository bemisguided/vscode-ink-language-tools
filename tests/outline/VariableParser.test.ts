import { VariableParser } from "../../src/outline/VariableParser";
import { OutlineParserContext } from "../../src/outline/OutlineParserContext";
import { SymbolType } from "../../src/model/OutlineEntity";

describe("VariableParser", () => {
  let parser: VariableParser;
  let context: OutlineParserContext;

  beforeEach(() => {
    parser = new VariableParser();
    context = new OutlineParserContext();
  });

  it("parses a standard VAR line", () => {
    // Setup
    const line = "VAR score = 10";

    // Execute
    const entity = parser.tryParse(line, 0, context);

    // Assert
    expect(entity).not.toBeNull();
    expect(entity!.name).toBe("score");
    expect(entity!.type).toBe(SymbolType.variable);
    expect(entity!.definitionLine).toBe(0);
  });

  it("parses a VAR line with extra whitespace", () => {
    // Setup
    const line = "  VAR    spacedVar   =   42  ";

    // Execute
    const entity = parser.tryParse(line, 7, context);

    // Assert
    expect(entity).not.toBeNull();
    expect(entity!.name).toBe("spacedVar");
    expect(entity!.type).toBe(SymbolType.variable);
    expect(entity!.definitionLine).toBe(7);
  });

  it("returns null for non-VAR lines", () => {
    // Setup
    const line = "INCLUDE file.ink";

    // Execute
    const entity = parser.tryParse(line, 1, context);

    // Assert
    expect(entity).toBeNull();
  });
});
