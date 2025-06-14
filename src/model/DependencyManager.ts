import * as vscode from "vscode";
import { DependencyNode } from "./DependencyNode";

export class DependencyManager {
  private static instance: DependencyManager;
  private graph: Map<vscode.Uri, DependencyNode> = new Map();

  private constructor() {}

  public static getInstance(): DependencyManager {
    if (!DependencyManager.instance) {
      DependencyManager.instance = new DependencyManager();
    }
    return DependencyManager.instance;
  }

  public getNode(uri: vscode.Uri): DependencyNode | undefined {
    return this.graph.get(uri);
  }

  public setNode(uri: vscode.Uri, node: DependencyNode): void {
    this.graph.set(uri, node);
  }

  public deleteNode(uri: vscode.Uri): void {
    this.graph.delete(uri);
  }

  public clearGraph(): void {
    this.graph.clear();
  }

  public getGraph(): Map<vscode.Uri, DependencyNode> {
    return this.graph;
  }
}
