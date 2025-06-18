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
import { SymbolType } from "../../../src/model/OutlineEntity";

describe("IncludeParser", () => {
  let parser: IncludeParser;

  beforeEach(() => {
    parser = new IncludeParser();
  });

  it("parses a standard INCLUDE line", () => {
    // Setup
    const line = "INCLUDE file.ink";

    // Execute
    const entity = parser.tryParse(line, 0);

    // Assert
    expect(entity).not.toBeNull();
    expect(entity!.name).toBe("file.ink");
    expect(entity!.type).toBe(SymbolType.include);
    expect(entity!.definitionLine).toBe(0);
  });

  it("parses an INCLUDE line with extra whitespace", () => {
    // Setup
    const line = "  INCLUDE    anotherFile.ink  ";

    // Execute
    const entity = parser.tryParse(line, 7);

    // Assert
    expect(entity).not.toBeNull();
    expect(entity!.name).toBe("anotherFile.ink");
    expect(entity!.type).toBe(SymbolType.include);
    expect(entity!.definitionLine).toBe(7);
  });

  it("parses an INCLUDE line with slashes in the path", () => {
    // Setup
    const line = "INCLUDE path/to/file.ink";

    // Execute
    const entity = parser.tryParse(line, 2);

    // Assert
    expect(entity).not.toBeNull();
    expect(entity!.name).toBe("path/to/file.ink");
    expect(entity!.type).toBe(SymbolType.include);
  });

  it("parses an INCLUDE line with dots in the path", () => {
    // Setup
    const line = "INCLUDE ../relative/other.ink";

    // Execute
    const entity = parser.tryParse(line, 3);

    // Assert
    expect(entity).not.toBeNull();
    expect(entity!.name).toBe("../relative/other.ink");
    expect(entity!.type).toBe(SymbolType.include);
  });

  it("parses an INCLUDE line with an absolute path", () => {
    // Setup
    const line = "INCLUDE /absolute/path/to/file.ink";

    // Execute
    const entity = parser.tryParse(line, 5);

    // Assert
    expect(entity).not.toBeNull();
    expect(entity!.name).toBe("/absolute/path/to/file.ink");
    expect(entity!.type).toBe(SymbolType.include);
  });

  it("returns null for non-INCLUDE lines", () => {
    // Setup
    const line = "VAR x = 1";

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
});
