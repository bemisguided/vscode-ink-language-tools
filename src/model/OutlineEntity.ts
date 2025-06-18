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

/**
 * Enum for Ink Entity types.
 */
export enum EntityType {
  const = "const",
  external = "external",
  function = "function",
  include = "include",
  knot = "knot",
  list = "list",
  listItem = "listItem",
  stitch = "stitch",
  variable = "variable",
}

/**
 * Represents any entity in the Ink outline.
 */
export class OutlineEntity {
  // Public Properties ===============================================================================================

  public name: string;
  public type: EntityType;
  public definitionRange: vscode.Range;
  public scopeRange: vscode.Range;
  public parent?: OutlineEntity;
  public children: OutlineEntity[] = [];
  public isBlock: boolean;

  // Constructor ======================================================================================================

  constructor(
    name: string,
    type: EntityType,
    definitionRange: vscode.Range,
    scopeRange: vscode.Range,
    isBlock: boolean = false,
    parent?: OutlineEntity
  ) {
    this.name = name;
    this.type = type;
    this.definitionRange = definitionRange;
    this.scopeRange = scopeRange;
    this.isBlock = isBlock;
    this.parent = parent;
  }

  // Public Methods ===================================================================================================

  /**
   * Add a child entity to this entity. Only allowed for knot, stitch, and list.
   * @param child - The child entity to add.
   */
  addChild(child: OutlineEntity) {
    if (
      this.type === EntityType.knot ||
      this.type === EntityType.stitch ||
      this.type === EntityType.list
    ) {
      child.parent = this;
      this.children.push(child);
    } else {
      throw new Error(`Entities of type '${this.type}' cannot have children.`);
    }
  }
}
