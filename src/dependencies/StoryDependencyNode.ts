import * as vscode from "vscode";
import { BaseDependencyNode } from "./BaseDependencyNode";

export class StoryDependencyNode extends BaseDependencyNode {
  public readonly type = "story";

  constructor(uri: vscode.Uri, version: number) {
    super(uri, version);
  }
}
