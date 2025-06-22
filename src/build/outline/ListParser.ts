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
import { OutlineEntity, EntityType } from "../../model/OutlineEntity";

/**
 * Parser for the LIST keyword of an Ink story for the outline.
 */
export class ListParser implements IEntityParser {
  // Private Properties ===============================================================================================

  private regex = /^LIST\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:=\s*(.*))?$/;

  // Public Properties ===============================================================================================

  readonly entityType = EntityType.list;

  readonly isBlockEntity = false;

  readonly isNestedEntity = false;

  readonly isRootEntity = true;

  // Public Methods ===================================================================================================

  /**
   * @inheritdoc
   */
  shouldPopStack(stack: OutlineEntity[]): boolean {
    return false;
  }

  /**
   * @inheritdoc
   */
  tryParse(line: string, lineNumber: number): OutlineEntity | null {
    const match = this.regex.exec(line.trim());
    if (!match) {
      return null;
    }
    const [_, listName, inlineItems] = match;
    const range = new vscode.Range(lineNumber, 0, lineNumber, line.length);
    const listEntity = new OutlineEntity(
      listName,
      EntityType.list,
      range,
      range,
      this.isBlockEntity
    );
    if (inlineItems) {
      const items = inlineItems
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      for (const item of items) {
        const itemEntity = new OutlineEntity(
          item,
          EntityType.listItem,
          range,
          range,
          this.isBlockEntity
        );
        listEntity.addChild(itemEntity);
      }
    }
    return listEntity;
  }
}
