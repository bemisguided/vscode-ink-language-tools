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
import { OutlineEntity, SymbolType } from "../../model/OutlineEntity";

function getSymbolKind(type: SymbolType): vscode.SymbolKind {
  switch (type) {
    case SymbolType.const:
      return vscode.SymbolKind.Constant;
    case SymbolType.external:
      return vscode.SymbolKind.Function;
    case SymbolType.function:
      return vscode.SymbolKind.Function;
    case SymbolType.list:
      return vscode.SymbolKind.Enum;
    case SymbolType.listItem:
      return vscode.SymbolKind.EnumMember;
    case SymbolType.include:
      return vscode.SymbolKind.File;
    case SymbolType.knot:
      return vscode.SymbolKind.Object;
    case SymbolType.stitch:
      return vscode.SymbolKind.Method;
    case SymbolType.variable:
      return vscode.SymbolKind.Variable;
    default:
      return vscode.SymbolKind.Object;
  }
}

function getDescription(type: SymbolType): string {
  switch (type) {
    case SymbolType.const:
      return "Constant";
    case SymbolType.function:
      return "Function";
    case SymbolType.external:
      return "External Function";
    case SymbolType.include:
      return "Include";
    case SymbolType.list:
      return "List";
    case SymbolType.listItem:
      return "List Item";
    case SymbolType.knot:
      return "Knot";
    case SymbolType.stitch:
      return "Stitch";
    case SymbolType.variable:
      return "Variable";
    default:
      return "Entity";
  }
}

function mapEntityToSymbol(entity: OutlineEntity): vscode.DocumentSymbol {
  const symbol = new vscode.DocumentSymbol(
    entity.name,
    getDescription(entity.type),
    getSymbolKind(entity.type),
    entity.scopeRange,
    entity.definitionRange
  );
  if (entity.children && entity.children.length > 0) {
    symbol.children = entity.children.map((child) => mapEntityToSymbol(child));
  }
  return symbol;
}

// Exported Functions =================================================================================================

/**
 * Maps a list of outline entities to a list of document symbols.
 * @param entities - The list of outline entities to map.
 * @returns The list of document symbols.
 */
export function mapOutlineEntitiesToSymbols(
  entities: OutlineEntity[]
): vscode.DocumentSymbol[] {
  return entities.map((entity) => mapEntityToSymbol(entity));
}
