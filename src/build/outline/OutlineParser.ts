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
   * Extracts all outline entities from the document lines (flat, no hierarchy).
   */
  private extractEntities(lines: string[]): OutlineEntity[] {
    const entities: OutlineEntity[] = [];
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      if (trimmed === "") {
        continue;
      }
      for (const strategy of this.strategies) {
        const entity = strategy.tryParse(line, i);
        if (entity) {
          entities.push(entity);
          break;
        }
      }
    }
    return entities;
  }

  /**
   * Assigns parent/child relationships to the extracted entities.
   */
  private assignParentChildRelationships(entities: OutlineEntity[]): void {
    const parentStack: OutlineEntity[] = [];
    for (const entity of entities) {
      // Find the strategy for this entity type
      const strategy = this.strategies.find(
        (s) => s.entityType === entity.type
      );
      if (!strategy) {
        continue;
      }
      // Pop stack as long as the parser says to
      while (strategy.shouldPopStack(parentStack)) {
        parentStack.pop();
      }
      if (strategy.isRootEntity) {
        // Root entity: clear stack if block, then push
        if (entity.isBlock) {
          parentStack.length = 0;
          parentStack.push(entity);
        }
        // No parent assignment needed for root
      } else {
        // Attach to parent if present, else leave as root
        const parent = parentStack[parentStack.length - 1];
        if (parent) {
          try {
            parent.addChild(entity);
          } catch (e) {
            // If parent cannot have children, leave as root
          }
        }
        // Push to stack if nested and block
        if (strategy.isNestedEntity && entity.isBlock) {
          parentStack.push(entity);
        }
      }
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
    lines: string[],
    parentEndLine?: number
  ): void {
    // First, collect all block entities and their indices
    const blockIndices: number[] = [];
    for (let i = 0; i < entities.length; i++) {
      if (this.blockTypes.has(entities[i].type)) {
        blockIndices.push(i);
      }
    }
    // Now, assign scope for each block entity
    for (let b = 0; b < blockIndices.length; b++) {
      const idx = blockIndices[b];
      const block = entities[idx];
      const startLine = block.definitionRange.start.line;
      let endLine: number;
      if (b < blockIndices.length - 1) {
        // End at the line before the next block entity
        const nextBlock = entities[blockIndices[b + 1]];
        endLine = nextBlock.definitionRange.start.line - 1;
      } else {
        // End at the parent block's end line, or end of document if not provided
        endLine = !!parentEndLine ? parentEndLine : lines.length - 1;
      }
      block.scopeRange = new vscode.Range(
        startLine,
        0,
        endLine,
        lines[endLine]?.length || 0
      );
      // Recurse into children, passing this block's end line
      if (block.children && block.children.length > 0) {
        this.setScopeRangesRecursive(block.children, lines, endLine);
      }
    }
  }

  // Public Methods ===================================================================================================

  /**
   * Parses the outline of an Ink story.
   * @param document - The document to parse.
   * @returns The outline entities.
   */
  public async parse(document: vscode.TextDocument): Promise<OutlineEntity[]> {
    // Step 1: Preprocess document
    const lines = this.preprocessDocument(document);
    // Step 2: Extract all entities (flat, no hierarchy)
    const entities = this.extractEntities(lines);
    // Step 3: Assign parent/child relationships
    this.assignParentChildRelationships(entities);
    // Only keep root entities (no parent)
    const rootEntities = entities.filter((e) => !e.parent);
    // Step 4: Assign scope ranges
    this.assignScopeRanges(rootEntities, lines);
    return rootEntities;
  }
}
