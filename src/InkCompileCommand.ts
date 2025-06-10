import * as vscode from "vscode";
import { CompilationResult } from "./types";
import { ICommand } from "./ICommand";
import { InkStoryManager } from "./InkStoryManager";

/**
 * Command handler for Ink compilation functionality.
 * Handles the core compilation process.
 */
export class InkCompileCommand implements ICommand {
  // Private Properties ===============================================================================================

  private compilationInProgress = false;

  // Constructor ======================================================================================================

  constructor() {}

  // Public Methods ===================================================================================================

  public dispose(): void {
    // Nothing to dispose
  }

  /**
   * Compiles an Ink file and returns any diagnostics.
   * @param fileName The path to the Ink file to compile
   * @param debug Whether to compile in debug mode
   * @returns Array of VSCode diagnostics from the compilation
   */
  public async execute(
    document: vscode.TextDocument,
    options: { debug: boolean }
  ): Promise<vscode.Diagnostic[]> {
    if (this.compilationInProgress) {
      return [];
    }

    this.compilationInProgress = true;
    try {
      const storyManager = InkStoryManager.getInstance();
      const result = await storyManager.compileStory(document, {
        debug: options.debug,
      });
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
      this.compilationInProgress = false;
    }
  }

  // Private Methods ==================================================================================================

  /**
   * Creates VSCode diagnostics from a compilation result
   */
  private createDiagnostics(result: CompilationResult): vscode.Diagnostic[] {
    const diagnostics: vscode.Diagnostic[] = [];

    // Add errors
    result.errors.forEach((error) => {
      diagnostics.push(
        new vscode.Diagnostic(
          new vscode.Range(error.line, error.column, error.line, error.column),
          error.message,
          vscode.DiagnosticSeverity.Error
        )
      );
    });

    // Add warnings
    result.warnings.forEach((warning) => {
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
    });

    return diagnostics;
  }
}
