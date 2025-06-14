import { FunctionParser } from "../../src/outline/FunctionParser";
import { OutlineParserContext } from "../../src/outline/OutlineParserContext";
import { SymbolType } from "../../src/model/OutlineEntity";

describe("FunctionParser", () => {
  let parser: FunctionParser;
  let context: OutlineParserContext;

  beforeEach(() => {
    parser = new FunctionParser();
    context = new OutlineParserContext();
  });

  it("parses a standard function line", () => {
    // Setup
    const line = "=== function myFunc(x, y) ===";

    // Execute
    const entity = parser.tryParse(line, 5, context);

    // Assert
    expect(entity).not.toBeNull();
    expect(entity!.name).toBe("myFunc(x, y)");
    expect(entity!.type).toBe(SymbolType.function);
    expect(entity!.definitionLine).toBe(5);
  });

  it("parses a function line with parameters", () => {
    // Setup
    const line = "=== function add(a, b) ===";

    // Execute
    const entity = parser.tryParse(line, 2, context);

    // Assert
    expect(entity).not.toBeNull();
    expect(entity!.name).toBe("add(a, b)");
    expect(entity!.type).toBe(SymbolType.function);
    expect(entity!.definitionLine).toBe(2);
  });

  it("parses a function line with extra whitespace", () => {
    // Setup
    const line = "==   function   spacedFunc  (  a, b  )   == ";

    // Execute
    const entity = parser.tryParse(line, 5, context);

    // Assert
    expect(entity).not.toBeNull();
    expect(entity!.name).toBe("spacedFunc(  a, b  )");
    expect(entity!.type).toBe(SymbolType.function);
    expect(entity!.definitionLine).toBe(5);
  });

  it("returns null for non-function lines", () => {
    // Setup
    const line = "VAR y = 2";

    // Execute & Assert
    expect(parser.tryParse(line, 0, context)).toBeNull();
  });
});
