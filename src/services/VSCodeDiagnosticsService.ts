import * as vscode from "vscode";

/**
 * Facade service to access VSCode DiagnosticCollection API.
 */
export interface VSCodeDiagnosticsService {
  /**
   * Clear all diagnostics.
   */
  clear(uri?: vscode.Uri): void;

  /**
   * Dispose of the collection.
   */
  dispose(): void;

  /**
   * Get diagnostics for a URI.
   * @param uri The document URI.
   */
  get(uri: vscode.Uri): readonly vscode.Diagnostic[] | undefined;

  /**
   * Set diagnostics for a URI.
   * @param uri The document URI.
   * @param diagnostics The diagnostics to set.
   */
  set(uri: vscode.Uri, diagnostics: vscode.Diagnostic[]): void;
}

/**
 * Service wrapper for VSCode DiagnosticCollection, to allow mocking and easier testing.
 */
export class VSCodeDiagnosticsServiceImpl implements VSCodeDiagnosticsService {
  // Private Properties ===============================================================================================
  private readonly collection: vscode.DiagnosticCollection;

  // Constructors =====================================================================================================
  /**
   * Create a new diagnostics service for the given collection.
   * @param collection The diagnostic collection.
   */
  constructor(collection: vscode.DiagnosticCollection) {
    this.collection = collection;
  }

  // Public Methods ===================================================================================================

  set(uri: vscode.Uri, diagnostics: vscode.Diagnostic[]): void {
    this.collection.set(uri, diagnostics);
  }

  get(uri: vscode.Uri): readonly vscode.Diagnostic[] | undefined {
    return this.collection.get(uri);
  }

  clear(uri?: vscode.Uri): void {
    if (uri) {
      this.collection.delete(uri);
    } else {
      this.collection.clear();
    }
  }

  dispose(): void {
    this.collection.dispose();
  }
}
