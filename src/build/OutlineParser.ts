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
import { KnotParser } from "./outline/KnotParser";
import { StitchParser } from "./outline/StitchParser";
import { FunctionParser } from "./outline/FunctionParser";
import { ExternalParser } from "./outline/ExternalParser";
import { VariableParser } from "./outline/VariableParser";
import { IncludeParser } from "./outline/IncludeParser";
import { OutlineEntity, EntityType } from "../model/OutlineEntity";
import { ListParser } from "./outline/ListParser";
import { ConstParser } from "./outline/ConstParser";
import { stripComments } from "./outline/stripComments";
import { IEntityParser } from "./outline/IEntityParser";
import { LabelParser } from "./outline/LabelParser";

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

  /**
   * Test-only method to clear the singleton instance.
   */
  public static clearInstance(): void {
    this.instance = null;
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
      new LabelParser(),
    ];
    this.blockTypes = new Set(
      this.strategies.filter((s) => s.isBlockEntity).map((s) => s.entityType)
    );
  }

  // Private Methods ===================================================================================================

  /**
   * Assigns parent/child relationships to the extracted entities.
   */
  private assignParentChildRelationships(entities: OutlineEntity[]): void {
    const parentStack: OutlineEntity[] = [];
    for (const entity of entities) {
      // Find the strategy for this entity type
      const entityStrategy = this.getStrategy(entity.type);

      // Pop stack as long as the parser says to
      while (entityStrategy.shouldPopStack(parentStack)) {
        parentStack.pop();
      }
      if (entityStrategy.isRootEntity) {
        // Root entity: clear stack if block, then push
        if (entity.isBlock) {
          parentStack.length = 0;
          parentStack.push(entity);
        }
        // No parent assignment needed for root
      } else {
        // Attach to parent if present and nestable, else leave as root
        const parent = parentStack[parentStack.length - 1];
        const parentStrategy = parent ? this.getStrategy(parent.type) : null;
        if (parentStrategy && parentStrategy.isNestedEntity) {
          parent.addChild(entity);
        }

        // Push to stack if nested and block
        if (entityStrategy.isNestedEntity && entity.isBlock) {
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
   * Gets the strategy for a given entity type.
   * @param type - The entity type.
   * @returns The strategy for the entity type.
   */
  private getStrategy(type: EntityType): IEntityParser {
    const strategy = this.strategies.find((s) => s.entityType === type);
    if (!strategy) {
      throw new Error(`No strategy found for entity type: ${type}`);
    }
    return strategy;
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
   * Strips comments and splits the document into lines.
   */
  private preprocessDocument(document: vscode.TextDocument): string[] {
    const cleanedText = stripComments(document.getText());
    return cleanedText.split(/\r?\n/);
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
