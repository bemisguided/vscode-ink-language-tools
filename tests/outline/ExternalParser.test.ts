import "../__mocks__/vscode";
import { ExternalParser } from "../../src/outline/ExternalParser";
import { OutlineParserContext } from "../../src/outline/OutlineParserContext";
import { SymbolType } from "../../src/dependencies/OutlineEntity";

describe("ExternalParser", () => {
  it("parses an EXTERNAL line into an OutlineEntity", () => {
    const parser = new ExternalParser();
    const context = new OutlineParserContext();
    const line = "EXTERNAL myFunction(param1, param2)";
    const entity = parser.tryParse(line, 3, context);

    expect(entity).not.toBeNull();
    expect(entity!.name).toBe("myFunction(param1, param2)");
    expect(entity!.type).toBe(SymbolType.external);
    expect(entity!.definitionLine).toBe(3);
    expect(entity!.definitionRange.start.line).toBe(3);
    expect(entity!.definitionRange.end.line).toBe(3);
    expect(entity!.scopeRange.start.line).toBe(3);
    expect(entity!.scopeRange.end.line).toBe(3);
  });

  it("parses an EXTERNAL line with extra whitespace", () => {
    const parser = new ExternalParser();
    const context = new OutlineParserContext();
    const line = "  EXTERNAL   spacedFunc  (  a, b  )   ";
    const entity = parser.tryParse(line, 5, context);
    expect(entity).not.toBeNull();
    expect(entity!.name).toBe("spacedFunc(  a, b  )");
    expect(entity!.type).toBe(SymbolType.external);
    expect(entity!.definitionLine).toBe(5);
  });

  it("parses an EXTERNAL line with no parameters", () => {
    const parser = new ExternalParser();
    const context = new OutlineParserContext();
    const line = "EXTERNAL noParams";
    const entity = parser.tryParse(line, 6, context);
    expect(entity).not.toBeNull();
    expect(entity!.name).toBe("noParams");
    expect(entity!.type).toBe(SymbolType.external);
    expect(entity!.definitionLine).toBe(6);
  });

  it("returns null for non-EXTERNAL lines", () => {
    const parser = new ExternalParser();
    const context = new OutlineParserContext();
    const line = "VAR something = 5";
    const entity = parser.tryParse(line, 0, context);
    expect(entity).toBeNull();
  });
});
