import * as vscode from "vscode";

export interface ICommand {
  execute(
    document: vscode.TextDocument,
    options: { debug: boolean }
  ): Promise<vscode.Diagnostic[]>;

  dispose(): void;
}
