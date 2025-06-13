import * as vscode from "vscode";
import { ExtensionSystem } from "./ExtensionSystem";
import { InkPreviewPanel } from "./panels/preview/InkPreviewPanel";

export class PreviewCommand implements ExtensionSystem {
  private previewInProgress: boolean = false;

  activate(context: vscode.ExtensionContext): void {
    const previewCommand = vscode.commands.registerCommand(
      "ink.openPreview",
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
        if (this.previewInProgress) {
          return;
        }
        this.previewInProgress = true;
        try {
          const panel = InkPreviewPanel.getInstance();
          if (panel) {
            panel.initialize(document);
          }
          vscode.window.showInformationMessage(
            "Ink story previewed successfully."
          );
        } catch (err: any) {
          vscode.window.showErrorMessage(
            `Failed to preview Ink story: ${err.message || err}`
          );
        } finally {
          this.previewInProgress = false;
        }
      }
    );
    context.subscriptions.push(previewCommand);
  }

  dispose(): void {
    // No explicit resources to dispose in this implementation
  }
}
