import * as vscode from "vscode";
import { BaseDependencyNode } from "./BaseDependencyNode";

export class ExternalFunctionDependencyNode extends BaseDependencyNode {
  public readonly type = "externalFunctions";

  constructor(uri: vscode.Uri, version: number) {
    super(uri, version);
  }
}
