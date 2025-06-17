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

export function stripComments(text: string): string {
  let result = "";
  let i = 0;
  const len = text.length;
  while (i < len) {
    // Single-line comment
    if (text[i] === "/" && text[i + 1] === "/") {
      // Replace '//' with spaces
      result += "  ";
      i += 2;
      // Replace until end of line or end of text
      while (i < len && text[i] !== "\n") {
        result += " ";
        i++;
      }
    } else if (text[i] === "/" && text[i + 1] === "*") {
      // Multi-line comment
      result += "  ";
      i += 2;
      while (i < len) {
        if (text[i] === "*" && text[i + 1] === "/") {
          result += "  ";
          i += 2;
          break;
        } else if (text[i] === "\n") {
          result += "\n";
          i++;
        } else {
          result += " ";
          i++;
        }
      }
    } else {
      result += text[i];
      i++;
    }
  }
  return result;
}
