import * as vscode from "vscode";
import { OutlineEntity, SymbolType } from "../dependencies/OutlineEntity";

function getSymbolKind(type: SymbolType): vscode.SymbolKind {
  switch (type) {
    case SymbolType.knot:
      return vscode.SymbolKind.Namespace;
    case SymbolType.stitch:
      return vscode.SymbolKind.Method;
    case SymbolType.list:
      return vscode.SymbolKind.Enum;
    case SymbolType.listItem:
      return vscode.SymbolKind.EnumMember;
    case SymbolType.function:
      return vscode.SymbolKind.Function;
    case SymbolType.external:
      return vscode.SymbolKind.Interface;
    case SymbolType.variable:
      return vscode.SymbolKind.Variable;
    case SymbolType.include:
      return vscode.SymbolKind.File;
    default:
      return vscode.SymbolKind.Object;
  }
}

function getDescription(type: SymbolType): string {
  switch (type) {
    case SymbolType.knot:
      return "Knot";
    case SymbolType.stitch:
      return "Stitch";
    case SymbolType.list:
      return "List";
    case SymbolType.listItem:
      return "List Item";
    case SymbolType.function:
      return "Function";
    case SymbolType.external:
      return "External Function";
    case SymbolType.variable:
      return "Variable";
    case SymbolType.include:
      return "Include File";
    default:
      return "Entity";
  }
}

export function mapOutlineEntitiesToSymbols(
  entities: OutlineEntity[]
): vscode.DocumentSymbol[] {
  return entities.map((entity) => mapEntityToSymbol(entity));
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
