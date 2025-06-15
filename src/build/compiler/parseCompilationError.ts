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

/**
 * Represents the details of a compilation error.
 */
export type CompilationErrorDetails = {
  message: string;
  line: number;
  filename?: string;
  severity: "ERROR" | "WARNING";
};

// Exported Functions =================================================================================================

/**
 * Parses the error text and returns the details of the error.
 * @param errorText - The error text to parse.
 * @returns The details of the error.
 */
export function parseCompilationError(
  errorText: string
): CompilationErrorDetails {
  let line = 0;
  let message = errorText;
  let filename: string | undefined = undefined;
  let severity: "ERROR" | "WARNING" = "ERROR";

  // Extract severity from prefix
  const sevMatch = errorText.match(/^(ERROR|WARNING):/i);
  if (sevMatch) {
    severity = sevMatch[1].toUpperCase() as "ERROR" | "WARNING";
  }

  // Extract filename if present (between quotes after ERROR: or WARNING:)
  // Example: ERROR: '/path/file.ink' line 18: ...
  const fileMatch = errorText.match(/^[A-Z]+:\s*'([^']+)'\s+line/i);
  if (fileMatch) {
    filename = fileMatch[1];
  }

  // Parse line number from various patterns
  const lineMatch = errorText.match(/line (\d+)/i);
  if (lineMatch) {
    line = parseInt(lineMatch[1], 10) - 1; // Convert to 0-based
  }

  // Extract everything after the first colon following the line number
  // Example: ... line 18: Message here\n(more lines)
  const lineNumMatch = /line \d+/i.exec(errorText);
  if (lineNumMatch) {
    const colonIndex = errorText.indexOf(
      ":",
      lineNumMatch.index + lineNumMatch[0].length
    );
    if (colonIndex !== -1) {
      message = errorText.slice(colonIndex + 1).trim();
    }
  }

  return { message, line, filename, severity };
}
