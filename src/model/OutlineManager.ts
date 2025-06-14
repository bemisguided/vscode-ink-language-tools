import * as vscode from "vscode";
import { OutlineEntity } from "./OutlineEntity";

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
}
