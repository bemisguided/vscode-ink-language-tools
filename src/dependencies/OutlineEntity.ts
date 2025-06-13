import * as vscode from "vscode";

/**
 * Enum for Ink Symbol types.
 */
export enum SymbolType {
  knot = "knot",
  stitch = "stitch",
  list = "list",
  listItem = "listItem",
  function = "function",
  external = "external",
  variable = "variable",
  include = "include",
}

/**
 * Represents any entity in the Ink outline.
 */
export class OutlineEntity {
  name: string;
  type: SymbolType;
  definitionLine: number;
  definitionRange: vscode.Range;
  scopeRange: vscode.Range;
  parent?: OutlineEntity;
  children: OutlineEntity[] = [];

  constructor(
    name: string,
    type: SymbolType,
    definitionLine: number,
    definitionRange: vscode.Range,
    scopeRange: vscode.Range,
    parent?: OutlineEntity
  ) {
    this.name = name;
    this.type = type;
    this.definitionLine = definitionLine;
    this.definitionRange = definitionRange;
    this.scopeRange = scopeRange;
    this.parent = parent;
  }

  /**
   * Add a child entity to this entity. Only allowed for knot, stitch, and list.
   */
  addChild(child: OutlineEntity) {
    if (
      this.type === SymbolType.knot ||
      this.type === SymbolType.stitch ||
      this.type === SymbolType.list
    ) {
      child.parent = this;
      this.children.push(child);
    } else {
      throw new Error(`Entities of type '${this.type}' cannot have children.`);
    }
  }
}
