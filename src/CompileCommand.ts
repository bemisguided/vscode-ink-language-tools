import * as vscode from "vscode";
import { ExtensionSystem } from "./ExtensionSystem";
import { BuildEngine } from "./build/BuildEngine";

export class CompileCommand implements ExtensionSystem {
  private buildEngine: BuildEngine;

  constructor(diagnosticCollection: vscode.DiagnosticCollection) {
    this.buildEngine = BuildEngine.getInstance(diagnosticCollection);
  }

  activate(context: vscode.ExtensionContext): void {
    const compileCommand = vscode.commands.registerCommand(
      "ink.compileFile",
      async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
          vscode.window.showErrorMessage("No active document.");
          return;
        }
        const document = editor.document;
        if (document.languageId !== "ink") {
          vscode.window.showErrorMessage(
            "Active document is not an Ink story."
          );
          return;
        }
        await document.save();
        try {
          await this.buildEngine.processFile(document.uri);
          vscode.window.showInformationMessage(
            "Ink file compiled successfully."
          );
        } catch (err: any) {
          vscode.window.showErrorMessage(
            `Failed to compile Ink file: ${err.message || err}`
          );
        }
      }
    );
    context.subscriptions.push(compileCommand);
  }

  dispose(): void {
    // No explicit resources to dispose in this implementation
  }
}
