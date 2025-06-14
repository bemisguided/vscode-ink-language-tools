import * as vscode from "vscode";

export enum DependencyNodeType {
  story = "story",
  externalFunctions = "externalFunctions",
}

export class DependencyNode {
  public deps: Set<vscode.Uri> = new Set(); // dependencies (INCLUDES & MOCKS)
  public revDeps: Set<vscode.Uri> = new Set(); // reverse dependencies (who depends on me)

  constructor(
    public readonly uri: vscode.Uri, // unique identifier for the file
    public version: number, // document version or file mtime
    public readonly type: DependencyNodeType
  ) {}

  public addDep(dep: vscode.Uri): void {
    this.deps.add(dep);
  }

  public removeDep(dep: vscode.Uri): void {
    this.deps.delete(dep);
  }

  static fromUri(uri: vscode.Uri, version: number = 0): DependencyNode {
    if (uri.path.endsWith(".ink")) {
      return new DependencyNode(uri, version, DependencyNodeType.story);
    }
    if (uri.path.endsWith(".js")) {
      return new DependencyNode(
        uri,
        version,
        DependencyNodeType.externalFunctions
      );
    }
    throw new Error(`Unsupported file type: ${uri.path}`);
  }
}
