/**
 * MIT License
 *
 * Copyright (c) 2025 Martin Crawford
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import * as vscode from "vscode";

/**
 * Facade service for workspace navigation operations.
 * Handles opening/closing/focusing editors and webview panels.
 */
export interface IWorkspaceNavigationService {
  /**
   * Dispose of the workspace navigation service.
   */
  dispose(): void;

  /**
   * Open a document editor. If already open, focuses the existing editor.
   * @param uri The URI of the document to open
   * @param lineNumber Optional line number to navigate to
   * @returns The TextEditor, or undefined if the document couldn't be opened
   */
  openDocumentEditor(
    uri: vscode.Uri,
    lineNumber?: number
  ): Promise<vscode.TextEditor | undefined>;

  /**
   * Focus an existing webview panel if it's open.
   * @param id The ID of the panel to focus
   * @returns The focused WebviewPanel, or undefined if not open
   */
  focusWebviewPanel(id: string): Promise<vscode.WebviewPanel | undefined>;

  /**
   * Open and focus a webview panel. If already open, focuses the existing panel.
   * @param id The ID of the panel to open and focus
   * @param position The position where to open the panel
   * @returns The WebviewPanel, or undefined if the panel couldn't be opened
   */
  openAndFocusWebviewPanel(
    id: string,
    position: vscode.ViewColumn
  ): Promise<vscode.WebviewPanel | undefined>;

  /**
   * Close a webview panel if it's open.
   * @param id The ID of the panel to close
   */
  closePanel(id: string): Promise<void>;

  /**
   * Check if a webview panel is currently open.
   * @param id The ID of the panel to check
   * @returns True if the panel is open
   */
  isPanelOpen(id: string): boolean;
}

/**
 * Implementation of the VSCodeWorkspaceNavigationService.
 */
export class VSCodeWorkspaceNavigationServiceImpl
  implements IWorkspaceNavigationService
{
  // Private Properties ===============================================================================================

  private readonly panelRegistry = new Map<string, vscode.WebviewPanel>();

  // Constructor ======================================================================================================

  constructor() {}

  // Public Methods ===================================================================================================

  /**
   * @inheritdoc
   */
  public dispose(): void {
    // Close all registered panels
    for (const [id, panel] of this.panelRegistry) {
      panel.dispose();
    }
    this.panelRegistry.clear();
  }

  /**
   * @inheritdoc
   */
  public async openDocumentEditor(
    uri: vscode.Uri,
    lineNumber?: number
  ): Promise<vscode.TextEditor | undefined> {
    try {
      // Check if already open among visible editors
      const targetUriString = uri.toString();
      for (const editor of vscode.window.visibleTextEditors) {
        if (editor.document.uri.toString() === targetUriString) {
          await this.doFocusEditor(editor);
          if (lineNumber !== undefined) {
            await this.doNavigateToLine(editor, lineNumber);
          }
          return editor;
        }
      }

      // If not already open, open the document
      const document = await this.doOpenTextDocument(uri);
      const editor = await this.doShowTextDocument(document, lineNumber);
      return editor;
    } catch (error) {
      console.error(
        `[VSCodeWorkspaceNavigationService] Failed to open document: ${uri.toString()}`,
        error
      );
      return undefined;
    }
  }

  /**
   * @inheritdoc
   */
  public async focusWebviewPanel(
    id: string
  ): Promise<vscode.WebviewPanel | undefined> {
    const panel = this.panelRegistry.get(id);
    if (panel) {
      this.doFocusPanel(panel);
      return panel;
    }
    return undefined;
  }

  /**
   * @inheritdoc
   */
  public async openAndFocusWebviewPanel(
    id: string,
    position: vscode.ViewColumn
  ): Promise<vscode.WebviewPanel | undefined> {
    // Check if already open
    const existingPanel = this.panelRegistry.get(id);
    if (existingPanel) {
      this.doFocusPanel(existingPanel);
      return existingPanel;
    }

    // Note: This service doesn't create panels, it only manages existing ones
    // The caller is responsible for creating the panel and registering it
    return undefined;
  }

  /**
   * @inheritdoc
   */
  public async closePanel(id: string): Promise<void> {
    const panel = this.panelRegistry.get(id);
    if (panel) {
      panel.dispose();
      this.panelRegistry.delete(id);
    }
  }

  /**
   * @inheritdoc
   */
  public isPanelOpen(id: string): boolean {
    return this.panelRegistry.has(id);
  }

  // Public Panel Management Methods ==================================================================================

  /**
   * Register a webview panel with the service for management.
   * This should be called when a panel is created to enable focus/close operations.
   * @param id The ID of the panel
   * @param panel The webview panel to register
   */
  public registerPanel(id: string, panel: vscode.WebviewPanel): void {
    this.panelRegistry.set(id, panel);

    // Auto-unregister when panel is disposed
    panel.onDidDispose(() => {
      this.panelRegistry.delete(id);
    });
  }

  /**
   * Unregister a webview panel from the service.
   * @param id The ID of the panel to unregister
   */
  public unregisterPanel(id: string): void {
    this.panelRegistry.delete(id);
  }

  // Protected Methods ==============================================================================================

  /**
   * Open a text document.
   * @param uri The URI of the document to open
   * @returns The opened TextDocument
   */
  protected async doOpenTextDocument(
    uri: vscode.Uri
  ): Promise<vscode.TextDocument> {
    return await vscode.workspace.openTextDocument(uri);
  }

  /**
   * Show a text document in an editor.
   * @param document The document to show
   * @param line Optional line number to navigate to
   * @returns The TextEditor
   */
  protected async doShowTextDocument(
    document: vscode.TextDocument,
    line?: number
  ): Promise<vscode.TextEditor> {
    const options: vscode.TextDocumentShowOptions = {};
    if (line !== undefined) {
      options.selection = new vscode.Range(line, 0, line, 0);
    }
    return await vscode.window.showTextDocument(document, options);
  }

  /**
   * Focus an editor.
   * @param editor The editor to focus
   */
  protected async doFocusEditor(editor: vscode.TextEditor): Promise<void> {
    await vscode.window.showTextDocument(editor.document, editor.viewColumn);
  }

  /**
   * Navigate to a specific line in an editor.
   * @param editor The editor to navigate in
   * @param line The line number to navigate to
   */
  protected async doNavigateToLine(
    editor: vscode.TextEditor,
    line: number
  ): Promise<void> {
    const range = new vscode.Range(line, 0, line, 0);
    editor.selection = new vscode.Selection(range.start, range.end);
    editor.revealRange(range);
  }

  /**
   * Focus a webview panel.
   * @param panel The panel to focus
   */
  protected doFocusPanel(panel: vscode.WebviewPanel): void {
    panel.reveal();
  }
}
