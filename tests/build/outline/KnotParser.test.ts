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
import { EntityType } from "../../../src/model/OutlineEntity";

describe("KnotParser", () => {
  let parser: KnotParser;

  beforeEach(() => {
    parser = new KnotParser();
  });

  it("parses a standard knot line", () => {
    // Setup
    const line = "=== myKnot ===";

    // Execute
    const entity = parser.tryParse(line, 0);

    // Assert
    expect(entity).not.toBeNull();
    expect(entity!.name).toBe("myKnot");
    expect(entity!.type).toBe(EntityType.knot);
    expect(entity!.definitionRange.start.line).toBe(0);
  });

  it("parses a knot line with extra whitespace", () => {
    // Setup
    const line = "  ===   spacedKnot   ===  ";

    // Execute
    const entity = parser.tryParse(line, 7);

    // Assert
    expect(entity).not.toBeNull();
    expect(entity!.name).toBe("spacedKnot");
    expect(entity!.type).toBe(EntityType.knot);
    expect(entity!.definitionRange.start.line).toBe(7);
  });

  it("returns null for non-knot lines", () => {
    // Setup
    const line = "INCLUDE file.ink";

    // Execute
    const entity = parser.tryParse(line, 1);

    // Assert
    expect(entity).toBeNull();
  });

  it("shouldPopStack always returns true if stack is not empty", () => {
    // Execute & Assert
    expect(parser.shouldPopStack([])).toBe(false);
    expect(parser.shouldPopStack([{} as any])).toBe(true);
  });
});
