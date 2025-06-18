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
import { SymbolType } from "../../../src/model/OutlineEntity";

describe("ExternalParser", () => {
  let parser: ExternalParser;

  beforeEach(() => {
    parser = new ExternalParser();
  });

  it("parses a standard EXTERNAL line", () => {
    // Setup
    const line = "EXTERNAL myFunc(x, y)";

    // Execute
    const entity = parser.tryParse(line, 0);

    // Assert
    expect(entity).not.toBeNull();
    expect(entity!.name).toBe("myFunc(x, y)");
    expect(entity!.type).toBe(SymbolType.external);
    expect(entity!.definitionLine).toBe(0);
  });

  it("parses an EXTERNAL line with extra whitespace", () => {
    // Setup
    const line = "  EXTERNAL    spacedFunc   ( a, b )  ";

    // Execute
    const entity = parser.tryParse(line, 7);

    // Assert
    expect(entity).not.toBeNull();
    expect(entity!.name).toBe("spacedFunc(a, b)");
    expect(entity!.type).toBe(SymbolType.external);
    expect(entity!.definitionLine).toBe(7);
  });

  it("returns null for non-EXTERNAL lines", () => {
    // Setup
    const line = "INCLUDE file.ink";

    // Execute
    const entity = parser.tryParse(line, 1);

    // Assert
    expect(entity).toBeNull();
  });

  it("shouldPopStack always returns false", () => {
    // Execute & Assert
    expect(parser.shouldPopStack([])).toBe(false);
    expect(parser.shouldPopStack([{} as any])).toBe(false);
  });

  it("parses EXTERNAL with a ref as a parameter", () => {
    const line = "EXTERNAL myFunc(ref param1, param2)";
    const entity = parser.tryParse(line, 3);
    expect(entity).not.toBeNull();
    expect(entity!.name).toBe("myFunc(ref param1, param2)");
    expect(entity!.type).toBe(SymbolType.external);
    expect(entity!.definitionLine).toBe(3);
  });

  it("parses EXTERNAL with a divert as a parameter", () => {
    const line = "EXTERNAL myFunc(-> return_to)";
    const entity = parser.tryParse(line, 4);
    expect(entity).not.toBeNull();
    expect(entity!.name).toBe("myFunc(-> return_to)");
    expect(entity!.type).toBe(SymbolType.external);
    expect(entity!.definitionLine).toBe(4);
  });

  it("parses EXTERNAL with a ref and a divert as parameters", () => {
    const line = "EXTERNAL myFunc(ref param1, param2, -> return_to)";
    const entity = parser.tryParse(line, 5);
    expect(entity).not.toBeNull();
    expect(entity!.name).toBe("myFunc(ref param1, param2, -> return_to)");
    expect(entity!.type).toBe(SymbolType.external);
    expect(entity!.definitionLine).toBe(5);
  });
});
