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
import { OutlineEntity, SymbolType } from "./OutlineEntity";

/**
 * Singleton which manages the Outline of Ink stories.
 */
export class OutlineManager {
  // Private Static Properties ========================================================================================

  private static instance: OutlineManager;

  // Public Static Methods ============================================================================================

  public static getInstance(): OutlineManager {
    if (!OutlineManager.instance) {
      OutlineManager.instance = new OutlineManager();
    }
    return OutlineManager.instance;
  }

  // Private Properties ===============================================================================================

  private outlines: Map<string, OutlineEntity[]> = new Map();

  // Constructor ======================================================================================================
  private constructor() {}

  /**
   * Get the outline (root entities) for a document URI.
   */
  public getOutline(uri: vscode.Uri): OutlineEntity[] | undefined {
    return this.outlines.get(uri.toString());
  }

  /**
   * Set the outline (root entities) for a document URI.
   */
  public setOutline(uri: vscode.Uri, entities: OutlineEntity[]): void {
    this.outlines.set(uri.toString(), entities);
  }

  public clear(): void {
    this.outlines.clear();
  }

  /**
   * Generic query for outline entities in a document.
   * @param uri The document URI.
   * @param filter A predicate function to filter entities.
   * @returns Array of matching OutlineEntity objects.
   */
  public query(
    uri: vscode.Uri,
    filter: (entity: OutlineEntity) => boolean
  ): OutlineEntity[] {
    const outline = this.getOutline(uri);
    if (!outline) {
      return [];
    }
    return outline.filter(filter);
  }

  /**
   * Query for outline entities by type(s).
   * @param uri The document URI.
   * @param types One or more SymbolTypes.
   * @returns Array of matching OutlineEntity objects.
   */
  public queryByTypes(
    uri: vscode.Uri,
    types: SymbolType | SymbolType[]
  ): OutlineEntity[] {
    const typeSet = Array.isArray(types) ? new Set(types) : new Set([types]);
    return this.query(uri, (entity) => typeSet.has(entity.type));
  }
}
