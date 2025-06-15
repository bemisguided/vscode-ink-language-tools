/**
 * MIT License
 *
 * Copyright (c) 2025 Martin Crawford
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

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
