import * as vscode from "vscode";

export interface VSCodeDiagnosticsService {
  set(uri: vscode.Uri, diagnostics: vscode.Diagnostic[]): void;
  get(uri: vscode.Uri): readonly vscode.Diagnostic[] | undefined;
  delete(uri: vscode.Uri): void;
  clear(): void;
  dispose(): void;
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

  /**
   * Set diagnostics for a URI.
   * @param uri The document URI.
   * @param diagnostics The diagnostics to set.
   */
  set(uri: vscode.Uri, diagnostics: vscode.Diagnostic[]): void {
    this.collection.set(uri, diagnostics);
  }

  /**
   * Get diagnostics for a URI.
   * @param uri The document URI.
   */
  get(uri: vscode.Uri): readonly vscode.Diagnostic[] | undefined {
    return this.collection.get(uri);
  }

  /**
   * Delete diagnostics for a URI.
   * @param uri The document URI.
   */
  delete(uri: vscode.Uri): void {
    this.collection.delete(uri);
  }

  /**
   * Clear all diagnostics.
   */
  clear(): void {
    this.collection.clear();
  }

  /**
   * Dispose of the collection.
   */
  dispose(): void {
    this.collection.dispose();
  }
}
