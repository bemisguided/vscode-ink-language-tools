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

import { FunctionParser } from "../../../src/build/outline/FunctionParser";
import { SymbolType } from "../../../src/model/OutlineEntity";

describe("FunctionParser", () => {
  let parser: FunctionParser;

  beforeEach(() => {
    parser = new FunctionParser();
  });

  it("parses a standard function line without parentheses", () => {
    // Setup
    const line = "=== function myFunc ===";

    // Execute
    const entity = parser.tryParse(line, 0);

    // Assert
    expect(entity).not.toBeNull();
    expect(entity!.name).toBe("myFunc");
    expect(entity!.type).toBe(SymbolType.function);
    expect(entity!.definitionLine).toBe(0);
  });

  it("parses a standard function line with parentheses", () => {
    // Setup
    const line = "=== function myFunc() ===";

    // Execute
    const entity = parser.tryParse(line, 1);

    // Assert
    expect(entity).not.toBeNull();
    expect(entity!.name).toBe("myFunc()");
    expect(entity!.type).toBe(SymbolType.function);
    expect(entity!.definitionLine).toBe(1);
  });

  it("parses a function line with parameters", () => {
    // Setup
    const line = "=== function add(a, b) ===";

    // Execute
    const entity = parser.tryParse(line, 2);

    // Assert
    expect(entity).not.toBeNull();
    expect(entity!.name).toBe("add(a, b)");
    expect(entity!.type).toBe(SymbolType.function);
    expect(entity!.definitionLine).toBe(2);
  });

  it("parses a function line with extra whitespace", () => {
    // Setup
    const line = "  ===   function   spacedFunc   ===  ";

    // Execute
    const entity = parser.tryParse(line, 7);

    // Assert
    expect(entity).not.toBeNull();
    expect(entity!.name).toBe("spacedFunc");
    expect(entity!.type).toBe(SymbolType.function);
    expect(entity!.definitionLine).toBe(7);
  });

  it("parses a function line with a divert as a parameter", () => {
    // Setup
    const line = "=== function myFunc(-> divert) ===";

    // Execute
    const entity = parser.tryParse(line, 1);

    // Assert
    expect(entity).not.toBeNull();
    expect(entity!.name).toBe("myFunc(-> divert)");
  });

  it("parses a function line with a ref as a parameter", () => {
    // Setup
    const line = "=== function myFunc(ref param) ===";

    // Execute
    const entity = parser.tryParse(line, 1);

    // Assert
    expect(entity).not.toBeNull();
    expect(entity!.name).toBe("myFunc(ref param)");
  });

  it("returns null for non-function lines", () => {
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
});
