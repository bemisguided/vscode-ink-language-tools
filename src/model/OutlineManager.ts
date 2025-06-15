import * as vscode from "vscode";
import { OutlineEntity, SymbolType } from "./OutlineEntity";

/**
 * Singleton manager for document outlines.
 */
export class OutlineManager {
  private static instance: OutlineManager;
  private outlines: Map<string, OutlineEntity[]> = new Map();

  private constructor() {}

  public static getInstance(): OutlineManager {
    if (!OutlineManager.instance) {
      OutlineManager.instance = new OutlineManager();
    }
    return OutlineManager.instance;
  }

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
