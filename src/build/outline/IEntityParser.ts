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

import { OutlineParserContext } from "./OutlineParserContext";
import { OutlineEntity } from "../../model/OutlineEntity";

/**
 * Interface for a parser that can try to parse an entity from a line of text.
 */
export interface IEntityParser {
  // Public Methods ===================================================================================================

  /**
   * Tries to parse an entity from a line of text.
   * @param line - The line of text to parse.
   * @param lineNumber - The line number of the text.
   * @param context - The context of the parser.
   * @returns The parsed entity or null if no entity was found.
   */
  tryParse(
    line: string,
    lineNumber: number,
    context: OutlineParserContext
  ): OutlineEntity | null;
}
