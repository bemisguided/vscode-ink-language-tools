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
      // Compile the story first
      const result = await this.inkCompiler.compile({
        filePath: document.uri.fsPath,
        content: document.getText(),
        debug: false,
      });

      if (!result.success || !result.jsonOutput) {
        return this.createDiagnostics(result);
      }

      // Create or show the preview panel
      const panel = InkPreviewPanel.getInstance();

      // Load the story into the preview panel
      if (panel) {
        panel.loadStory(result);
      }

      return this.createDiagnostics(result);
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

  // Private Methods ==================================================================================================

  /**
   * Creates VSCode diagnostics from a compilation result
   */
  private createDiagnostics(result: any): vscode.Diagnostic[] {
    const diagnostics: vscode.Diagnostic[] = [];

    // Add errors
    if (result.errors) {
      for (const error of result.errors) {
        diagnostics.push(
          new vscode.Diagnostic(
            new vscode.Range(
              error.line,
              error.column,
              error.line,
              error.column
            ),
            error.message,
            vscode.DiagnosticSeverity.Error
          )
        );
      }
    }

    // Add warnings
    if (result.warnings) {
      for (const warning of result.warnings) {
        diagnostics.push(
          new vscode.Diagnostic(
            new vscode.Range(
              warning.line,
              warning.column,
              warning.line,
              warning.column
            ),
            warning.message,
            vscode.DiagnosticSeverity.Warning
          )
        );
      }
    }

    return diagnostics;
  }
}
