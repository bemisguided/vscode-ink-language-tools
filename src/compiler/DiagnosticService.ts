import * as vscode from "vscode";
import { CompilationError } from "./types";

/**
 * Service for managing VSCode diagnostics.
 * Handles the creation and display of error and warning messages in the editor.
 */
export class DiagnosticService {
  // Private Properties ===============================================================================================

  private diagnosticCollection: vscode.DiagnosticCollection;

  // Constructor ======================================================================================================

  /**
   * Creates a new diagnostic service.
   * @param name - The name of the diagnostic collection
   */
  constructor(name: string) {
    this.diagnosticCollection =
      vscode.languages.createDiagnosticCollection(name);
  }

  // Public Methods ===================================================================================================

  /**
   * Shows diagnostics for a file.
   * @param filePath - The path of the file to show diagnostics for
   * @param errors - Array of compilation errors
   * @param warnings - Array of compilation warnings
   */
  public showDiagnostics(
    filePath: string,
    errors: CompilationError[],
    warnings: CompilationError[]
  ): void {
    const diagnostics: vscode.Diagnostic[] = [];

    // Convert errors to diagnostics
    for (const error of errors) {
      diagnostics.push(
        this.createDiagnostic(error, vscode.DiagnosticSeverity.Error)
      );
    }

    // Convert warnings to diagnostics
    for (const warning of warnings) {
      diagnostics.push(
        this.createDiagnostic(warning, vscode.DiagnosticSeverity.Warning)
      );
    }

    // Update the diagnostic collection
    this.diagnosticCollection.set(vscode.Uri.file(filePath), diagnostics);
  }

  /**
   * Clears all diagnostics for a file.
   * @param filePath - The path of the file to clear diagnostics for
   */
  public clearDiagnostics(filePath: string): void {
    this.diagnosticCollection.delete(vscode.Uri.file(filePath));
  }

  /**
   * Disposes of the diagnostic collection.
   */
  public dispose(): void {
    this.diagnosticCollection.dispose();
  }

  // Private Methods ===================================================================================================

  /**
   * Creates a VSCode diagnostic from a compilation error.
   * @param error - The compilation error to convert
   * @param severity - The severity level of the diagnostic
   * @returns A VSCode diagnostic
   */
  private createDiagnostic(
    error: CompilationError,
    severity: vscode.DiagnosticSeverity
  ): vscode.Diagnostic {
    const range = new vscode.Range(
      error.line - 1,
      error.column - 1,
      error.line - 1,
      error.column
    );

    return new vscode.Diagnostic(range, error.message, severity);
  }
}
