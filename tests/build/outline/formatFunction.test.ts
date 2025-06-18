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

import { formatFunction } from "../../../src/build/outline/formatFunction";

describe("formatFunction", () => {
  it("formats name and params with trimming", () => {
    // Execute & Assert
    expect(formatFunction("myFunc", "a, b")).toBe("myFunc(a, b)");
    expect(formatFunction("  myFunc  ", "  a ,  b  ")).toBe("myFunc(a, b)");
    expect(formatFunction(" spacedFunc ", "  a,   b, c ")).toBe(
      "spacedFunc(a, b, c)"
    );
  });

  it("returns name() if params is empty or undefined", () => {
    // Execute & Assert
    expect(formatFunction("noParams")).toBe("noParams()");
    expect(formatFunction("noParams", "")).toBe("noParams()");
    expect(formatFunction("noParams", "   ")).toBe("noParams()");
  });

  it("handles single param with spaces", () => {
    // Execute & Assert
    expect(formatFunction("singleParam", "  x  ")).toBe("singleParam(x)");
  });

  it("supports 'ref' prefix for parameters", () => {
    // Execute & Assert
    expect(formatFunction("my_other_function", "ref param1, param2")).toBe(
      "my_other_function(ref param1, param2)"
    );
    expect(
      formatFunction("my_other_function", "  ref   param1 , param2  ")
    ).toBe("my_other_function(ref param1, param2)");
  });

  it("supports '->' divert marker before params", () => {
    // Execute & Assert
    expect(formatFunction("my_function", "-> return_to")).toBe(
      "my_function(-> return_to)"
    );
    expect(formatFunction("my_function", "  ->   return_to  ")).toBe(
      "my_function(-> return_to)"
    );
    expect(formatFunction("my_function", "-> return_to, param2")).toBe(
      "my_function(-> return_to, param2)"
    );
  });

  it("supports both 'ref' and '->' in params", () => {
    // Execute & Assert
    expect(
      formatFunction("complexFunc", "ref param1, -> return_to, param3")
    ).toBe("complexFunc(ref param1, -> return_to, param3)");
    expect(
      formatFunction(
        "complexFunc",
        "  ref   param1 ,  ->   return_to , param3  "
      )
    ).toBe("complexFunc(ref param1, -> return_to, param3)");
  });
});
