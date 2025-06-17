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

import { ConstParser } from "../../../src/build/outline/ConstParser";
import { OutlineParserContext } from "../../../src/build/outline/OutlineParserContext";
import { SymbolType } from "../../../src/model/OutlineEntity";

describe("ConstParser", () => {
  let parser: ConstParser;
  let context: OutlineParserContext;

  beforeEach(() => {
    parser = new ConstParser();
    context = new OutlineParserContext();
  });

  it("parses a standard CONST line", () => {
    // Setup
    const line = "CONST myConst = 10";

    // Execute
    const entity = parser.tryParse(line, 0, context);

    // Assert
    expect(entity).not.toBeNull();
    expect(entity!.name).toBe("myConst");
    expect(entity!.type).toBe(SymbolType.const);
    expect(entity!.definitionLine).toBe(0);
  });

  it("parses a VAR line with extra whitespace", () => {
    // Setup
    const line = "  CONST    spacedConst   =   42  ";

    // Execute
    const entity = parser.tryParse(line, 7, context);

    // Assert
    expect(entity).not.toBeNull();
    expect(entity!.name).toBe("spacedConst");
    expect(entity!.type).toBe(SymbolType.const);
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
