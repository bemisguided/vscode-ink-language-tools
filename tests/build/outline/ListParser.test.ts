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

import { ListParser } from "../../../src/build/outline/ListParser";
import { OutlineParserContext } from "../../../src/build/outline/OutlineParserContext";
import { SymbolType } from "../../../src/model/OutlineEntity";

describe("ListParser", () => {
  let parser: ListParser;
  let context: OutlineParserContext;

  beforeEach(() => {
    parser = new ListParser();
    context = new OutlineParserContext();
  });

  it("parses a simple LIST line", () => {
    // Setup
    const line = "LIST fruits";

    // Execute
    const entity = parser.tryParse(line, 0, context);

    // Assert
    expect(entity).not.toBeNull();
    expect(entity!.name).toBe("fruits");
    expect(entity!.type).toBe(SymbolType.list);
    expect(entity!.children.length).toBe(0);
  });

  it("parses a LIST line with inline items", () => {
    // Setup
    const line = "LIST colors = red, green, blue";

    // Execute
    const entity = parser.tryParse(line, 1, context);

    // Assert
    expect(entity).not.toBeNull();
    expect(entity!.name).toBe("colors");
    expect(entity!.type).toBe(SymbolType.list);
    expect(entity!.children.length).toBe(3);
    expect(entity!.children.map((c) => c.name)).toEqual([
      "red",
      "green",
      "blue",
    ]);
    expect(entity!.children.every((c) => c.type === SymbolType.listItem)).toBe(
      true
    );
  });

  it("returns null for non-LIST lines", () => {
    // Setup
    const line = "VAR x = 1";

    // Execute
    const entity = parser.tryParse(line, 0, context);

    // Assert
    expect(entity).toBeNull();
  });

  it("parses a LIST line with default values for items", () => {
    // Setup
    const line = "LIST animals = cat, (dog), (mouse)";

    // Execute
    const entity = parser.tryParse(line, 2, context);

    // Assert
    expect(entity).not.toBeNull();
    expect(entity!.name).toBe("animals");
    expect(entity!.type).toBe(SymbolType.list);
    expect(entity!.children.length).toBe(3);
    expect(entity!.children.map((c) => c.name)).toEqual([
      "cat",
      "(dog)",
      "(mouse)",
    ]);
    // By default, no explicit value assignment, just names
  });

  it("parses a LIST line with explicit values assigned to items", () => {
    // Setup
    const line = "LIST points = gold=10, silver=5, bronze=1";

    // Execute
    const entity = parser.tryParse(line, 3, context);

    // Assert
    expect(entity).not.toBeNull();
    expect(entity!.name).toBe("points");
    expect(entity!.type).toBe(SymbolType.list);
    expect(entity!.children.length).toBe(3);
    expect(entity!.children.map((c) => c.name)).toEqual([
      "gold=10",
      "silver=5",
      "bronze=1",
    ]);
    // If the parser is later enhanced to split name/value, update this test
  });
});
