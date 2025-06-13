import * as vscode from "vscode";
import { BaseDependencyNode } from "./BaseDependencyNode";

export class PartialStoryDependencyNode extends BaseDependencyNode {
  public readonly type = "partialStory";

  constructor(uri: vscode.Uri, version: number) {
    super(uri, version);
  }
}
