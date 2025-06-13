import * as vscode from "vscode";

export interface ExtensionSystem {
  activate(context: vscode.ExtensionContext): void;
  dispose(): void;
}
