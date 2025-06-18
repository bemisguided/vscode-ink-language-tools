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

import { StitchParser } from "../../../src/build/outline/StitchParser";
import { SymbolType } from "../../../src/model/OutlineEntity";

describe("StitchParser", () => {
  let parser: StitchParser;

  beforeEach(() => {
    parser = new StitchParser();
  });

  it("parses a standard stitch line", () => {
    // Setup
    const line = "= myStitch";

    // Execute
    const entity = parser.tryParse(line, 0);

    // Assert
    expect(entity).not.toBeNull();
    expect(entity!.name).toBe("myStitch");
    expect(entity!.type).toBe(SymbolType.stitch);
    expect(entity!.definitionLine).toBe(0);
  });

  it("parses a stitch line with extra whitespace", () => {
    // Setup
    const line = "  =   spacedStitch  ";

    // Execute
    const entity = parser.tryParse(line, 7);

    // Assert
    expect(entity).not.toBeNull();
    expect(entity!.name).toBe("spacedStitch");
    expect(entity!.type).toBe(SymbolType.stitch);
    expect(entity!.definitionLine).toBe(7);
  });

  it("returns null for non-stitch lines", () => {
    // Setup
    const line = "INCLUDE file.ink";

    // Execute
    const entity = parser.tryParse(line, 1);

    // Assert
    expect(entity).toBeNull();
  });

  it("shouldPopStack returns true if stack contains a stitch or knot", () => {
    // Execute & Assert
    expect(parser.shouldPopStack([])).toBe(false);
    expect(parser.shouldPopStack([{ type: SymbolType.knot } as any])).toBe(
      false
    );
    expect(parser.shouldPopStack([{ type: SymbolType.stitch } as any])).toBe(
      true
    );
    expect(parser.shouldPopStack([{ type: SymbolType.list } as any])).toBe(
      false
    );
  });
});
