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
import { OutlineEntity, EntityType } from "../../model/OutlineEntity";
import { ListParser } from "./ListParser";
import { ConstParser } from "./ConstParser";
import { stripComments } from "./stripComments";
import { IEntityParser } from "./IEntityParser";

/**
 * Parser for the outline of an Ink story.
 */
export class OutlineParser {
  // Private Properties ===============================================================================================

  private static instance: OutlineParser | null = null;
  private strategies: IEntityParser[];
  private blockTypes: Set<EntityType>;

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
      new ConstParser(),
      new ExternalParser(),
      new FunctionParser(),
      new IncludeParser(),
      new KnotParser(),
      new ListParser(),
      new StitchParser(),
      new VariableParser(),
    ];
    this.blockTypes = new Set(
      this.strategies.filter((s) => s.isBlockEntity).map((s) => s.entityType)
    );
  }

  // Private Methods ===================================================================================================

  /**
   * Strips comments and splits the document into lines.
   */
  private preprocessDocument(document: vscode.TextDocument): string[] {
    const cleanedText = stripComments(document.getText());
    return cleanedText.split(/\r?\n/);
  }

  /**
   * Parses the lines into outline entities, handling stack and parent/child relationships.
   */
  private parseEntities(lines: string[]): OutlineEntity[] {
    const entities: OutlineEntity[] = [];
    const parentStack: OutlineEntity[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      if (trimmed === "") {
        continue;
      }
      for (const strategy of this.strategies) {
        const entity = strategy.tryParse(line, i);
        if (entity) {
          // Pop stack as long as the parser says to
          while (strategy.shouldPopStack(parentStack)) {
            const popped = parentStack.pop();
            if (popped && popped.isBlock) {
              // Set scope range for the block entity
              popped.scopeRange = new vscode.Range(
                popped.definitionRange.start.line,
                0,
                i - 1,
                lines[i - 1]?.length || 0
              );
            }
          }

          if (strategy.isRootEntity) {
            // Attach to root
            entities.push(entity);
            // Only reset stack if this root entity is a block
            if (entity.isBlock) {
              parentStack.length = 0;
              parentStack.push(entity);
            }
            // Otherwise, do not touch the stack
          } else {
            // Attach to parent if present, else to root
            const parent = parentStack[parentStack.length - 1];
            if (parent) {
              try {
                parent.addChild(entity);
              } catch (e) {
                entities.push(entity);
              }
            } else {
              entities.push(entity);
            }
            // Push to stack if nested and block
            if (strategy.isNestedEntity && entity.isBlock) {
              parentStack.push(entity);
            }
          }
          break;
        }
      }
    }
    // Set scope for any remaining blocks on the stack
    const lastLine = lines.length - 1;
    while (parentStack.length > 0) {
      const popped = parentStack.pop();
      if (popped && popped.isBlock) {
        popped.scopeRange = new vscode.Range(
          popped.definitionRange.start.line,
          0,
          lastLine,
          lines[lastLine]?.length || 0
        );
      }
    }
    return entities;
  }

  /**
   * Attaches an entity to its parent or the root, and manages the parent stack.
   */
  private attachEntity(
    entity: OutlineEntity,
    strategy: any,
    parentStack: OutlineEntity[],
    entities: OutlineEntity[]
  ): void {
    if (strategy.isRootEntity) {
      entities.push(entity);
      // Do not push to stack
      return;
    }
    const parent = parentStack[parentStack.length - 1];
    if (parent) {
      try {
        parent.addChild(entity);
      } catch (e) {
        entities.push(entity);
      }
    } else {
      entities.push(entity);
    }
    // Only push to stack if isNestedEntity is true AND isRootEntity is false
    if (strategy.isNestedEntity && !strategy.isRootEntity) {
      parentStack.push(entity);
    }
  }

  /**
   * Assigns scope ranges to all block entities (e.g., knots, stitches).
   */
  private assignScopeRanges(entities: OutlineEntity[], lines: string[]): void {
    this.setScopeRangesRecursive(entities, lines);
  }

  /**
   * Recursively sets scope ranges for all block entities.
   */
  private setScopeRangesRecursive(
    entities: OutlineEntity[],
    lines: string[]
  ): void {
    let lastBlock: OutlineEntity | null = null;
    for (let i = 0; i < entities.length; i++) {
      const entity = entities[i];
      if (this.blockTypes.has(entity.type)) {
        if (lastBlock) {
          lastBlock.scopeRange = new vscode.Range(
            lastBlock.definitionRange.start.line,
            0,
            entity.definitionRange.start.line - 1,
            lines[entity.definitionRange.start.line - 1]?.length || 0
          );
        }
        lastBlock = entity;
      }
      if (entity.children && entity.children.length > 0) {
        this.setScopeRangesRecursive(entity.children, lines);
      }
    }
    if (lastBlock) {
      lastBlock.scopeRange = new vscode.Range(
        lastBlock.definitionRange.start.line,
        0,
        lines.length - 1,
        lines[lines.length - 1]?.length || 0
      );
    }
  }

  // Public Methods ===================================================================================================

  /**
   * Parses the outline of an Ink story.
   * @param document - The document to parse.
   * @returns The outline entities.
   */
  public async parse(document: vscode.TextDocument): Promise<OutlineEntity[]> {
    const lines = this.preprocessDocument(document);
    const entities = this.parseEntities(lines);
    this.assignScopeRanges(entities, lines);
    return entities;
  }
}
