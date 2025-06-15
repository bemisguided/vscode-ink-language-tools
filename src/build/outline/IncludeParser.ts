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

import * as vscode from "vscode";
import { IEntityParser } from "./IEntityParser";
import { OutlineParserContext } from "./OutlineParserContext";
import { OutlineEntity, SymbolType } from "../../model/OutlineEntity";

/**
 * Parser for the INCLUDE keyword of an Ink story for the outline.
 */
export class IncludeParser implements IEntityParser {
  // Private Properties ===============================================================================================

  private regex = /^INCLUDE\s+(.+\.ink)\s*$/;

  // Public Methods ===================================================================================================

  tryParse(
    line: string,
    lineNumber: number,
    context: OutlineParserContext
  ): OutlineEntity | null {
    const match = this.regex.exec(line.trim());
    if (!match) {
      return null;
    }
    const [_, path] = match;
    const range = new vscode.Range(lineNumber, 0, lineNumber, line.length);
    return new OutlineEntity(
      path,
      SymbolType.include,
      lineNumber,
      range,
      range
    );
  }
}
