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

import { EntityType, OutlineEntity } from "../../model/OutlineEntity";

/**
 * Interface for a parser that can try to parse an entity from a line of text.
 */
export interface IEntityParser {
  // Public Properties ================================================================================================

  /**
   * The type of entity this parser handles.
   */
  readonly entityType: EntityType;

  /**
   * Whether this entity type is a block entity.
   */
  readonly isBlockEntity: boolean;

  /**
   * Whether this entity type is a nested Outline Entity.
   */
  readonly isNestedEntity: boolean;

  /**
   * Whether this entity type is always a root Outline Entity.
   */
  readonly isRootEntity: boolean;

  // Public Methods ===================================================================================================

  /**
   * Determines whether the stack should be popped before handling this entity.
   * @param stack - The current parent stack.
   * @returns True if the stack should be popped, false otherwise.
   */
  shouldPopStack(stack: OutlineEntity[]): boolean;

  /**
   * Tries to parse an entity from a line of text.
   * @param line - The line of text to parse.
   * @param lineNumber - The line number in the document.
   * @returns The parsed entity or null if no entity was found.
   */
  tryParse(line: string, lineNumber: number): OutlineEntity | null;
}
