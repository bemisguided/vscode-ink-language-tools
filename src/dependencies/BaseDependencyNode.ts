import * as vscode from "vscode";

export abstract class BaseDependencyNode {
  public deps: Set<vscode.Uri> = new Set(); // dependencies (INCLUDES & MOCKS)
  public revDeps: Set<vscode.Uri> = new Set(); // reverse dependencies (who depends on me)

  constructor(
    public readonly uri: vscode.Uri, // unique identifier for the file
    public version: number // document version or file mtime
  ) {}

  public abstract readonly type: "story" | "partialStory" | "externalFunctions";

  public addDep(dep: vscode.Uri): void {
    this.deps.add(dep);
  }

  public removeDep(dep: vscode.Uri): void {
    this.deps.delete(dep);
  }
}
