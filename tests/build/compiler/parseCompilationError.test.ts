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

import { parseCompilationError } from "../../../src/build/compiler/parseCompilationError";

describe("parseCompilationError()", () => {
  it("parses single-line error with filename and line with severity", () => {
    // Setup
    const filename = "/User/test/test.ink";
    const line = 20;
    const message =
      "Apparent loose end exists where the flow runs out. Do you need a '-> DONE' statement, choice or divert? Note that if you intend to enter 'test_stictch' next, you need to divert to it explicitly.";
    const errorText = `WARNING: '${filename}' line ${line}: ${message}`;

    // Execute
    const result = parseCompilationError(errorText);

    // Assert
    expect(result.filename).toBe(filename);
    expect(result.line).toBe(19); // 0-based
    expect(result.severity).toBe("WARNING");
    expect(result.message).toBe(message);
  });

  it("parses multi-line error with filename and line with severity", () => {
    // Setup
    const filename = "/User/test/test.ink";
    const line = 18;
    const message =
      "Logic following a '~' can't be that type of expression. It can only be something like:\n\t~ return\n\t~ var x = blah\n\t~ x++\n\t~ myFunction()";
    const errorText = `ERROR: '${filename}' line ${line}: ${message}`;

    // Execute
    const result = parseCompilationError(errorText);

    // Assert
    expect(result.filename).toBe(filename);
    expect(result.line).toBe(17); // 0-based
    expect(result.severity).toBe("ERROR");
    expect(result.message).toBe(message);
  });

  it("parses TODO error with filename and line with severity", () => {
    // Setup
    const filename = "/User/test/test.ink";
    const line = 18;
    const message =
      "Logic following a '~' can't be that type of expression. It can only be something like:\n\t~ return\n\t~ var x = blah\n\t~ x++\n\t~ myFunction()";
    const errorText = `TODO: '${filename}' line ${line}: ${message}`;

    // Execute
    const result = parseCompilationError(errorText);

    // Assert
    expect(result.filename).toBe(filename);
    expect(result.line).toBe(17); // 0-based
    expect(result.severity).toBe("TODO");
    expect(result.message).toBe(message);
  });
});
