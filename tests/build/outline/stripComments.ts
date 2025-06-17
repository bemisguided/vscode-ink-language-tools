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

import { stripComments } from "../../../src/build/outline/stripComments";

describe("stripComments()", () => {
  it("removes single-line comments at start of line", () => {
    // Setup
    const input = "// comment\nlet x = 1;";
    const expec = "          \nlet x = 1;";

    // Execute & Assert
    expect(stripComments(input)).toBe(expec);
  });

  it("removes single-line comments mid-line", () => {
    // Setup
    const input = "let x = 1; // comment";
    const expec = "let x = 1;           ";

    // Execute & Assert
    expect(stripComments(input)).toBe(expec);
  });

  it("removes multi-line comments spanning lines", () => {
    // Setup
    const input = "let x = /* comment\n   still comment */ 1;";
    const expec = "let x =           \n                    1;";

    // Execute & Assert
    expect(stripComments(input)).toBe(expec);
  });

  it("removes multi-line comments on one line", () => {
    // Setup
    const input = "let x = /* comment */ 1;";
    const expec = "let x =               1;";

    // Execute & Assert
    expect(stripComments(input)).toBe(expec);
  });

  it("removes multiple comments in one file", () => {
    // Setup
    const input = "let x = 1; // comment\nlet y = /* comment */ 2;";
    const expec = "let x = 1;           \nlet y =               2;";

    // Execute & Assert
    expect(stripComments(input)).toBe(expec);
  });

  it("preserves code before and after comments", () => {
    // Setup
    const input = "let x = /* comment */ 1; // end";
    const expec = "let x =               1;       ";

    // Execute & Assert
    expect(stripComments(input)).toBe(expec);
  });

  it("preserves newlines and line count", () => {
    // Setup
    const input = "let x = 1;\n/* comment\n   still comment */\nlet y = 2;";
    const expec = "let x = 1;\n          \n                   \nlet y = 2;";

    // Execute & Assert
    expect(stripComments(input)).toBe(expec);
  });
});
