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

import { IncludeParser } from "../../../src/build/outline/IncludeParser";
import { OutlineParserContext } from "../../../src/build/outline/OutlineParserContext";
import { SymbolType } from "../../../src/model/OutlineEntity";

describe("IncludeParser", () => {
  let parser: IncludeParser;
  let context: OutlineParserContext;

  beforeEach(() => {
    parser = new IncludeParser();
    context = new OutlineParserContext();
  });

  it("parses a standard INCLUDE line", () => {
    // Setup
    const line = "INCLUDE myfile.ink";

    // Execute
    const entity = parser.tryParse(line, 1, context);

    // Assert
    expect(entity).not.toBeNull();
    expect(entity!.name).toBe("myfile.ink");
    expect(entity!.type).toBe(SymbolType.include);
    expect(entity!.definitionLine).toBe(1);
  });

  it("parses an INCLUDE line with extra whitespace", () => {
    // Setup
    const line = "  INCLUDE    another_file.ink   ";

    // Execute
    const entity = parser.tryParse(line, 4, context);

    // Assert
    expect(entity).not.toBeNull();
    expect(entity!.name).toBe("another_file.ink");
    expect(entity!.type).toBe(SymbolType.include);
    expect(entity!.definitionLine).toBe(4);
  });

  it("parses an INCLUDE line with slashes in the path", () => {
    // Setup
    const line = "INCLUDE path/to/file.ink";

    // Execute
    const entity = parser.tryParse(line, 2, context);

    // Assert
    expect(entity).not.toBeNull();
    expect(entity!.name).toBe("path/to/file.ink");
    expect(entity!.type).toBe(SymbolType.include);
  });

  it("parses an INCLUDE line with dots in the path", () => {
    // Setup
    const line = "INCLUDE ../relative/other.ink";

    // Execute
    const entity = parser.tryParse(line, 3, context);

    // Assert
    expect(entity).not.toBeNull();
    expect(entity!.name).toBe("../relative/other.ink");
    expect(entity!.type).toBe(SymbolType.include);
  });

  it("parses an INCLUDE line with an absolute path", () => {
    // Setup
    const line = "INCLUDE /absolute/path/to/file.ink";

    // Execute
    const entity = parser.tryParse(line, 5, context);

    // Assert
    expect(entity).not.toBeNull();
    expect(entity!.name).toBe("/absolute/path/to/file.ink");
    expect(entity!.type).toBe(SymbolType.include);
  });

  it("returns null for non-INCLUDE lines", () => {
    // Setup
    const line = "VAR something = 5";

    // Execute
    const entity = parser.tryParse(line, 0, context);

    // Assert
    expect(entity).toBeNull();
    expect(parser.tryParse(line, 0, context)).toBeNull();
  });
});
