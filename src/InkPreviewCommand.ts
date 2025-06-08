import * as vscode from "vscode";
import { ICommand } from "./ICommand";

export class InkPreviewCommand implements ICommand {
  // Constructor ======================================================================================================

  constructor() {
    // Nothing to construct
  }

  // Public Methods ===================================================================================================

  public dispose(): void {
    // Nothing to dispose
  }

  public async execute(
    document: vscode.TextDocument
  ): Promise<vscode.Diagnostic[]> {
    console.log("Executing InkPreviewCommand", document.uri.fsPath);
    return [];
  }
}
