import { FunctionParser } from "../../src/outline/FunctionParser";
import { OutlineParserContext } from "../../src/outline/OutlineParserContext";
import { SymbolType } from "../../src/dependencies/OutlineEntity";

describe("FunctionParser", () => {
  it("parses a function line with parameters", () => {
    const parser = new FunctionParser();
    const context = new OutlineParserContext();
    const line = "== function myFunc(param1, param2) ==";
    const entity = parser.tryParse(line, 2, context);
    expect(entity).not.toBeNull();
    expect(entity!.name).toBe("myFunc(param1, param2)");
    expect(entity!.type).toBe(SymbolType.function);
    expect(entity!.definitionLine).toBe(2);
  });

  it("parses a function line with extra whitespace", () => {
    const parser = new FunctionParser();
    const context = new OutlineParserContext();
    const line = "==   function   spacedFunc  (  a, b  )   == ";
    const entity = parser.tryParse(line, 5, context);
    expect(entity).not.toBeNull();
    expect(entity!.name).toBe("spacedFunc(  a, b  )");
    expect(entity!.type).toBe(SymbolType.function);
    expect(entity!.definitionLine).toBe(5);
  });

  it("returns null for non-function lines", () => {
    const parser = new FunctionParser();
    const context = new OutlineParserContext();
    const line = "EXTERNAL something()";
    expect(parser.tryParse(line, 0, context)).toBeNull();
  });
});
