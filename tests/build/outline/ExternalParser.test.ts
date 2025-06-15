import "../../__mocks__/vscode";
import { ExternalParser } from "../../../src/build/outline/ExternalParser";
import { OutlineParserContext } from "../../../src/build/outline/OutlineParserContext";
import { SymbolType } from "../../../src/model/OutlineEntity";

describe("ExternalParser", () => {
  let parser: ExternalParser;
  let context: OutlineParserContext;

  beforeEach(() => {
    parser = new ExternalParser();
    context = new OutlineParserContext();
  });

  it("parses a standard EXTERNAL line", () => {
    // Setup
    const line = "EXTERNAL doSomething()";

    // Execute
    const entity = parser.tryParse(line, 2, context);

    // Assert
    expect(entity).not.toBeNull();
    expect(entity!.name).toBe("doSomething");
    expect(entity!.type).toBe(SymbolType.external);
    expect(entity!.definitionLine).toBe(2);
  });

  it("parses an EXTERNAL line with extra whitespace", () => {
    // Setup
    const line = "  EXTERNAL   spacedFunc  (  a, b  )   ";

    // Execute
    const entity = parser.tryParse(line, 5, context);

    // Assert
    expect(entity).not.toBeNull();
    expect(entity!.name).toBe("spacedFunc(  a, b  )");
    expect(entity!.type).toBe(SymbolType.external);
    expect(entity!.definitionLine).toBe(5);
  });

  it("parses an EXTERNAL line with no parameters", () => {
    // Setup
    const line = "EXTERNAL noParams";

    // Execute
    const entity = parser.tryParse(line, 6, context);

    // Assert
    expect(entity).not.toBeNull();
    expect(entity!.name).toBe("noParams");
    expect(entity!.type).toBe(SymbolType.external);
    expect(entity!.definitionLine).toBe(6);
  });

  it("returns null for non-EXTERNAL lines", () => {
    // Setup
    const line = "VAR x = 1";

    // Execute
    const entity = parser.tryParse(line, 0, context);

    // Assert
    expect(entity).toBeNull();
    expect(parser.tryParse(line, 0, context)).toBeNull();
  });
});
