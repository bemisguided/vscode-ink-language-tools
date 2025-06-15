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
import { KnotParser } from "./KnotParser";
import { StitchParser } from "./StitchParser";
import { FunctionParser } from "./FunctionParser";
import { ExternalParser } from "./ExternalParser";
import { VariableParser } from "./VariableParser";
import { IncludeParser } from "./IncludeParser";
import { OutlineParserContext } from "./OutlineParserContext";
import { OutlineEntity, SymbolType } from "../../model/OutlineEntity";
import { ListParser } from "./ListParser";

/**
 * Parser for the outline of an Ink story.
 */
export class OutlineParser {
  // Private Properties ===============================================================================================

  private static instance: OutlineParser | null = null;
  private strategies: any[];

  // Public Static Methods ============================================================================================

  /**
   * Gets the singleton instance of the outline parser.
   * @returns The singleton instance of the outline parser.
   */
  public static getInstance(): OutlineParser {
    if (!this.instance) {
      this.instance = new OutlineParser();
    }
    return this.instance;
  }

  // Constructor ======================================================================================================

  constructor() {
    this.strategies = [
      new IncludeParser(),
      new KnotParser(),
      new StitchParser(),
      new FunctionParser(),
      new ExternalParser(),
      new VariableParser(),
      new ListParser(),
    ];
  }

  // Public Methods ===================================================================================================

  /**
   * Parses the outline of an Ink story.
   * @param document - The document to parse.
   * @returns The outline entities.
   */
  public async parse(document: vscode.TextDocument): Promise<OutlineEntity[]> {
    const entities: OutlineEntity[] = [];
    const lines = document.getText().split(/\r?\n/);
    const context = new OutlineParserContext();
    let lastKnot: OutlineEntity | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      if (trimmed === "" || trimmed.startsWith("//")) {
        continue;
      }

      let handled = false;
      for (const strategy of this.strategies) {
        const entity = strategy.tryParse(line, i, context);
        if (entity) {
          // If this is a knot, handle scope range for the previous knot
          if (entity.type === SymbolType.knot) {
            if (lastKnot) {
              // Set the scope range of the previous knot
              lastKnot.scopeRange = new vscode.Range(
                lastKnot.definitionLine,
                0,
                i - 1,
                lines[i - 1]?.length || 0
              );
            }
            lastKnot = entity;
            context.knotStartLine = i;
            entities.push(entity);
          } else {
            entities.push(entity);
          }
          handled = true;
          break;
        }
      }
    }

    // After the loop, set the scope range for the last knot (if any)
    if (lastKnot) {
      lastKnot.scopeRange = new vscode.Range(
        lastKnot.definitionLine,
        0,
        lines.length - 1,
        lines[lines.length - 1]?.length || 0
      );
    }

    return entities;
  }
}
