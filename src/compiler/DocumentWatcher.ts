import * as vscode from "vscode";
import { InkCompiler } from "./InkCompiler";

export class DocumentWatcher {
  private compiler: InkCompiler;
  private compilationTimers: Map<string, NodeJS.Timeout> = new Map();
  private readonly DEBOUNCE_DELAY = 500; // 500ms debounce

  constructor(compiler: InkCompiler) {
    this.compiler = compiler;
    this.setupEventListeners();
  }

  /**
   * Set up VSCode event listeners for document changes
   */
  private setupEventListeners(): void {
    // Listen for document changes
    vscode.workspace.onDidChangeTextDocument((event) => {
      this.onDocumentChanged(event);
    });

    // Listen for document saves (immediate compilation)
    vscode.workspace.onDidSaveTextDocument((document) => {
      this.onDocumentSaved(document);
    });

    // Listen for document opens (compile to show any existing errors)
    vscode.workspace.onDidOpenTextDocument((document) => {
      this.onDocumentOpened(document);
    });
  }

  /**
   * Handle document change events with debouncing
   */
  private onDocumentChanged(event: vscode.TextDocumentChangeEvent): void {
    const document = event.document;

    // Only process .ink files
    if (!this.isInkFile(document)) {
      return;
    }

    const filePath = document.uri.fsPath;

    // Clear any existing timer for this file
    const existingTimer = this.compilationTimers.get(filePath);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set up new debounced compilation
    const timer = setTimeout(() => {
      this.compileDocument(document);
      this.compilationTimers.delete(filePath);
    }, this.DEBOUNCE_DELAY);

    this.compilationTimers.set(filePath, timer);
  }

  /**
   * Handle document save events (immediate compilation)
   */
  private onDocumentSaved(document: vscode.TextDocument): void {
    if (!this.isInkFile(document)) {
      return;
    }

    // Cancel any pending debounced compilation and compile immediately
    const filePath = document.uri.fsPath;
    const existingTimer = this.compilationTimers.get(filePath);
    if (existingTimer) {
      clearTimeout(existingTimer);
      this.compilationTimers.delete(filePath);
    }

    this.compileDocument(document);
  }

  /**
   * Handle document open events
   */
  private onDocumentOpened(document: vscode.TextDocument): void {
    if (!this.isInkFile(document)) {
      return;
    }

    // Compile immediately to show any existing errors
    this.compileDocument(document);
  }

  /**
   * Check if a document is an Ink file
   */
  private isInkFile(document: vscode.TextDocument): boolean {
    return document.languageId === "ink" || document.fileName.endsWith(".ink");
  }

  /**
   * Compile a document
   */
  private async compileDocument(document: vscode.TextDocument): Promise<void> {
    const filePath = document.uri.fsPath;

    try {
      console.log(`Compiling Ink file: ${filePath}`);
      const result = await this.compiler.compileFile(filePath);

      if (result.success) {
        console.log(`✓ Compilation successful: ${filePath}`);
        if (result.includedFiles.length > 0) {
          console.log(`  Included files: ${result.includedFiles.join(", ")}`);
        }
      } else {
        console.log(`✗ Compilation failed: ${filePath}`);
        console.log(
          `  Errors: ${result.errors.map((e) => e.message).join(", ")}`
        );
      }
    } catch (error) {
      console.error(`Unexpected error compiling ${filePath}:`, error);
    }
  }

  /**
   * Manually trigger compilation for a file (useful for testing)
   */
  public async compileFile(filePath: string): Promise<void> {
    try {
      const document = await vscode.workspace.openTextDocument(filePath);
      await this.compileDocument(document);
    } catch (error) {
      console.error(`Failed to compile file ${filePath}:`, error);
    }
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    // Clear all pending timers
    for (const timer of this.compilationTimers.values()) {
      clearTimeout(timer);
    }
    this.compilationTimers.clear();
  }
}
