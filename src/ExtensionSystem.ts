import * as vscode from "vscode";

export interface IExtensionPlugin {
  activate(context: vscode.ExtensionContext): void;
  dispose(): void;
}
