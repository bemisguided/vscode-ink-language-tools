import * as vscode from "vscode";
import { ICommand } from "./ICommand";
import { InkPreviewPanel } from "./panels/preview/InkPreviewPanel";
import { InkCompiler } from "./compiler/InkCompiler";

export class InkPreviewCommand implements ICommand {
  // Private Properties ===============================================================================================

  private inkCompiler: InkCompiler;
  private previewInProgress: boolean = false;

  // Constructor ======================================================================================================

  constructor() {
    this.inkCompiler = new InkCompiler();
  }

  // Public Methods ===================================================================================================

  public dispose(): void {
    // Nothing to dispose
  }

  public async execute(
    document: vscode.TextDocument
  ): Promise<vscode.Diagnostic[]> {
    if (this.previewInProgress) {
      return [];
    }

    this.previewInProgress = true;
    try {
      // Create or show the preview panel
      const panel = InkPreviewPanel.getInstance();

      // Load the story into the preview panel
      if (panel) {
        panel.initialize(document);
      }

      return [];
    } catch (error) {
      // Create a diagnostic for unexpected errors
      return [
        new vscode.Diagnostic(
          new vscode.Range(0, 0, 0, 0),
          error instanceof Error ? error.message : String(error),
          vscode.DiagnosticSeverity.Error
        ),
      ];
    } finally {
      this.previewInProgress = false;
    }
  }

}
