import * as vscode from "vscode";
import { InkCompileCommand } from "./InkCompileCommand";
import { InkPreviewCommand } from "./InkPreviewCommand";

/**
 * Main extension manager that handles all VSCode extension functionality.
 * Acts as a router to delegate to specific command handlers.
 * Implements the singleton pattern to ensure a single instance manages the extension.
 */
export class InkExtensionManager {
  private static instance: InkExtensionManager;
  private diagnosticCollection: vscode.DiagnosticCollection;
  private inkCompileCommand: InkCompileCommand;
  private inkPreviewCommand: InkPreviewCommand;

  // Constructor ======================================================================================================

  private constructor() {
    this.inkCompileCommand = new InkCompileCommand();
    this.inkPreviewCommand = new InkPreviewCommand();
    this.diagnosticCollection =
      vscode.languages.createDiagnosticCollection("ink");
  }

  // Public Methods ===================================================================================================

  /**
   * Gets the singleton instance of the extension manager.
   * Creates a new instance if one doesn't exist.
   */
  public static getInstance(): InkExtensionManager {
    if (!InkExtensionManager.instance) {
      InkExtensionManager.instance = new InkExtensionManager();
    }
    return InkExtensionManager.instance;
  }

  /**
   * VSCode Extension Framework Hook: Called when the extension is activated.
   * Sets up all extension functionality including:
   * - Command registration
   * - Event listeners
   * - Diagnostics
   * @param context The extension context provided by VSCode
   */
  public activate(context: vscode.ExtensionContext): void {
    // Register commands
    const previewCommand = vscode.commands.registerCommand(
      "ink.openPreview",
      () => this.previewStoryCurrent()
    );

    const compileCommand = vscode.commands.registerCommand(
      "ink.compileFile",
      () => this.compileFileCurrent(false)
    );

    const debugCompileCommand = vscode.commands.registerCommand(
      "ink.debugCompile",
      () => this.compileFileCurrent(true)
    );

    // Set up real-time compilation
    const documentChangeDisposable = vscode.workspace.onDidChangeTextDocument(
      async (event) => {
        if (!this.isInkFile(event.document)) {
          return;
        }
        await this.compileFile(event.document, false);
      }
    );

    // Add to subscriptions
    context.subscriptions.push(
      previewCommand,
      compileCommand,
      debugCompileCommand,
      documentChangeDisposable,
      this.diagnosticCollection
    );
  }

  /**
   * VSCode Extension Framework Hook: Called when the extension is deactivated.
   * Cleans up all resources and disposes of subscriptions.
   */
  public deactivate(): void {
    this.inkCompileCommand.dispose();
    this.inkPreviewCommand.dispose();
    this.diagnosticCollection.dispose();
  }

  // /**
  //  * Command Handler: Opens or updates the Ink story preview.
  //  * Creates a new preview if one doesn't exist, or reveals the existing one.
  //  */
  // private async previewStory(): Promise<void> {
  //   try {
  //     const editor = vscode.window.activeTextEditor;
  //     if (!editor) {
  //       vscode.window.showErrorMessage("No active editor");
  //       return;
  //     }

  //     const document = editor.document;
  //     if (document.languageId !== "ink") {
  //       vscode.window.showErrorMessage("Active file is not an Ink story");
  //       return;
  //     }

  //     // Create or show preview
  //     if (!this.currentView) {
  //       this.currentView = new StoryView(
  //         vscode.Uri.file(path.join(__dirname, ".."))
  //       );
  //       this.currentController = new StoryController(
  //         this.currentView,
  //         this.mockFunctionController
  //       );

  //       // Listen for disposal and clear references
  //       this.currentView["webview"].onDidDispose(() => {
  //         this.currentView = undefined;
  //         this.currentController = undefined;
  //       });
  //     } else {
  //       this.currentView.reveal();
  //     }

  //     // Load and parse the story
  //     const result = await this.inkCompileCommand.execute(
  //       document.uri.fsPath,
  //       { debug: false }
  //     );
  //     if (!result.success || !result.jsonOutput) {
  //       return;
  //     }

  //     // Parse mock functions if present
  //     this.parseMockFunctions(document);

  //     // Load the story
  //     this.currentController?.loadStory(result.jsonOutput);
  //   } catch (error) {
  //     if (error instanceof Error) {
  //       vscode.window.showErrorMessage(
  //         `Failed to preview story: ${error.message}`
  //       );
  //     } else {
  //       vscode.window.showErrorMessage(
  //         "Failed to preview story: Unknown error"
  //       );
  //     }
  //   }
  // }

  // Private Methods ==================================================================================================

  private ensureActiveDocument(): vscode.TextDocument | undefined {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showErrorMessage("No active document.");
      return undefined;
    }
    return editor.document;
  }

  private ensureInkFile(document: vscode.TextDocument): void {
    if (!this.isInkFile(document)) {
      vscode.window.showErrorMessage("Active document is not an Ink story.");
      return;
    }
  }

  private async compileFile(
    document: vscode.TextDocument,
    debug: boolean
  ): Promise<void> {
    this.ensureInkFile(document);
    // Save the document if it's open
    await document.save();

    const options = {
      debug,
    };
    const diagnostics = await this.inkCompileCommand.execute(document, options);
    this.updateDiagnostics(document, diagnostics);
  }

  private async compileFileCurrent(debug: boolean): Promise<void> {
    const document = this.ensureActiveDocument();
    if (!document) {
      return;
    }
    await this.compileFile(document, debug);
  }

  private isInkFile(document: vscode.TextDocument): boolean {
    return document.languageId === "ink";
  }

  private async previewStory(document: vscode.TextDocument): Promise<void> {
    this.ensureInkFile(document);
    const diagnostics = await this.inkPreviewCommand.execute(document);
    this.updateDiagnostics(document, diagnostics);
  }

  private async previewStoryCurrent(): Promise<void> {
    const document = this.ensureActiveDocument();
    if (!document) {
      return;
    }
    await this.previewStory(document);
  }

  private updateDiagnostics(
    document: vscode.TextDocument,
    diagnostics: vscode.Diagnostic[]
  ): void {
    this.diagnosticCollection.set(document.uri, diagnostics);
  }
}
