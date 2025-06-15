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

import { KnotParser } from "../../../src/build/outline/KnotParser";
import { OutlineParserContext } from "../../../src/build/outline/OutlineParserContext";
import { SymbolType } from "../../../src/model/OutlineEntity";

describe("KnotParser", () => {
  let parser: KnotParser;
  let context: OutlineParserContext;

  beforeEach(() => {
    parser = new KnotParser();
    context = new OutlineParserContext();
  });

  it("parses a standard knot line with two equals at start", () => {
    // Setup
    const line = "== myKnot";

    // Execute
    const entity = parser.tryParse(line, 0, context);

    // Assert
    expect(entity).not.toBeNull();
    expect(entity!.name).toBe("myKnot");
    expect(entity!.type).toBe(SymbolType.knot);
    expect(entity!.definitionLine).toBe(0);
    expect(context.currentKnot).toBe(entity);
  });

  it("parses a knot line with three equals at start and end (convention)", () => {
    // Setup
    const line = "=== myKnot ===";

    // Execute
    const entity = parser.tryParse(line, 1, context);

    // Assert
    expect(entity).not.toBeNull();
    expect(entity!.name).toBe("myKnot");
    expect(entity!.type).toBe(SymbolType.knot);
    expect(entity!.definitionLine).toBe(1);
    expect(context.currentKnot).toBe(entity);
  });

  it("parses a knot line with parameters and optional trailing equals", () => {
    // Setup
    const line = "== myKnot(x, y) ===";

    // Execute
    const entity = parser.tryParse(line, 2, context);

    // Assert
    expect(entity).not.toBeNull();
    expect(entity!.name).toBe("myKnot(x, y)");
    expect(entity!.type).toBe(SymbolType.knot);
    expect(entity!.definitionLine).toBe(2);
    expect(context.currentKnot).toBe(entity);
  });

  it("parses a knot line with extra whitespace and no trailing equals", () => {
    // Setup
    const line = "==   spacedKnot   ( a, b )   ";

    // Execute
    const entity = parser.tryParse(line, 3, context);

    // Assert
    expect(entity).not.toBeNull();
    expect(entity!.name).toBe("spacedKnot( a, b )");
    expect(entity!.type).toBe(SymbolType.knot);
    expect(entity!.definitionLine).toBe(3);
    expect(context.currentKnot).toBe(entity);
  });

  it("returns null for lines with only one equals at start", () => {
    // Setup
    const line = "= notAKnot";

    // Execute
    const entity = parser.tryParse(line, 4, context);

    // Assert
    expect(entity).toBeNull();
    expect(context.currentKnot).toBeNull();
  });

  it("returns null for lines with spaces in the knot name", () => {
    // Setup
    const line = "== not a knot ==";

    // Execute
    const entity = parser.tryParse(line, 5, context);

    // Assert
    expect(entity).toBeNull();
    expect(context.currentKnot).toBeNull();
  });

  it("returns null for non-knot lines", () => {
    // Setup
    const line = "VAR x = 1";

    // Execute
    const entity = parser.tryParse(line, 6, context);

    // Assert
    expect(entity).toBeNull();
    expect(context.currentKnot).toBeNull();
  });

  it("parses a knot line with whitespace before the first two equals", () => {
    // Setup
    const line = "   == myKnot";

    // Execute
    const entity = parser.tryParse(line, 7, context);

    // Assert
    expect(entity).not.toBeNull();
    expect(entity!.name).toBe("myKnot");
    expect(entity!.type).toBe(SymbolType.knot);
    expect(entity!.definitionLine).toBe(7);
    expect(context.currentKnot).toBe(entity);
  });
});
