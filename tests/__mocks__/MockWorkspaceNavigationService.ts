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
import { IWorkspaceNavigationService } from "../../src/services/VSCodeWorkspaceNavigationService";
import { mockVSCodeDocument } from "./mockVSCodeDocument";

/**
 * Mock implementation of the workspace navigation service for testing.
 */
export class MockWorkspaceNavigationService
  implements IWorkspaceNavigationService
{
  // Private Properties ===============================================================================================

  private readonly openEditors = new Map<string, vscode.TextEditor>();
  private readonly openPanels = new Map<string, vscode.WebviewPanel>();
  private readonly callLog: string[] = [];

  // Constructor ======================================================================================================

  constructor() {}

  // Public Methods ===================================================================================================

  /**
   * @inheritdoc
   */
  public dispose(): void {
    this.logCall("dispose");
    this.openEditors.clear();
    this.openPanels.clear();
  }

  /**
   * @inheritdoc
   */
  public async openDocumentEditor(
    uri: vscode.Uri,
    lineNumber?: number
  ): Promise<vscode.TextEditor | undefined> {
    this.logCall(`openDocumentEditor(${uri.toString()}, ${lineNumber})`);

    // Check if already open
    let editor = this.openEditors.get(uri.toString());
    if (editor) {
      return editor;
    }

    // Create mock editor
    const document = mockVSCodeDocument(uri, "Mock document content");
    editor = this.createMockEditor(document, lineNumber);
    this.openEditors.set(uri.toString(), editor);
    return editor;
  }

  /**
   * @inheritdoc
   */
  public async focusWebviewPanel(
    id: string
  ): Promise<vscode.WebviewPanel | undefined> {
    this.logCall(`focusWebviewPanel(${id})`);
    return this.openPanels.get(id);
  }

  /**
   * @inheritdoc
   */
  public async openAndFocusWebviewPanel(
    id: string,
    position: vscode.ViewColumn
  ): Promise<vscode.WebviewPanel | undefined> {
    this.logCall(`openAndFocusWebviewPanel(${id}, ${position})`);

    // Check if already open
    let panel = this.openPanels.get(id);
    if (panel) {
      return panel;
    }

    // Create mock panel
    panel = this.createMockPanel(id, position);
    this.openPanels.set(id, panel);
    return panel;
  }

  /**
   * @inheritdoc
   */
  public async closePanel(id: string): Promise<void> {
    this.logCall(`closePanel(${id})`);
    this.openPanels.delete(id);
  }

  /**
   * @inheritdoc
   */
  public isPanelOpen(id: string): boolean {
    this.logCall(`isPanelOpen(${id})`);
    return this.openPanels.has(id);
  }

  // Mock-specific Methods ============================================================================================

  /**
   * Mock an editor as being open for a document.
   * @param uri The URI of the document
   * @param content The content of the document
   * @param line Optional line number to position at
   * @returns The mocked editor
   */
  public mockOpenEditor(
    uri: vscode.Uri,
    content: string = "Mock content",
    line?: number
  ): vscode.TextEditor {
    const document = mockVSCodeDocument(uri, content);
    const editor = this.createMockEditor(document, line);
    this.openEditors.set(uri.toString(), editor);
    return editor;
  }

  /**
   * Mock a panel as being open.
   * @param id The ID of the panel
   * @param position The position of the panel
   * @returns The mocked panel
   */
  public mockOpenPanel(
    id: string,
    position: vscode.ViewColumn
  ): vscode.WebviewPanel {
    const panel = this.createMockPanel(id, position);
    this.openPanels.set(id, panel);
    return panel;
  }

  /**
   * Get the call log for testing verification.
   * @returns Array of method calls that were made
   */
  public getCallLog(): string[] {
    return [...this.callLog];
  }

  /**
   * Clear the call log.
   */
  public clearCallLog(): void {
    this.callLog.length = 0;
  }

  /**
   * Get all currently open editors.
   * @returns Map of URI strings to editors
   */
  public getOpenEditors(): Map<string, vscode.TextEditor> {
    return new Map(this.openEditors);
  }

  /**
   * Get all currently open panels.
   * @returns Map of panel IDs to panels
   */
  public getOpenPanels(): Map<string, vscode.WebviewPanel> {
    return new Map(this.openPanels);
  }

  // Private Methods ==================================================================================================

  private logCall(call: string): void {
    this.callLog.push(call);
  }

  private createMockEditor(
    document: vscode.TextDocument,
    line?: number
  ): vscode.TextEditor {
    const startPosition = new vscode.Position(line || 0, 0);
    const endPosition = new vscode.Position(line || 0, 0);
    const selection = new vscode.Selection(startPosition, endPosition);

    return {
      document,
      selection,
      selections: [selection],
      visibleRanges: [new vscode.Range(startPosition, endPosition)],
      options: {
        cursorStyle: vscode.TextEditorCursorStyle.Line,
        insertSpaces: true,
        lineNumbers: vscode.TextEditorLineNumbersStyle.On,
        tabSize: 2,
      },
      viewColumn: vscode.ViewColumn.One,
      edit: jest.fn(),
      insertSnippet: jest.fn(),
      setDecorations: jest.fn(),
      revealRange: jest.fn(),
      show: jest.fn(),
      hide: jest.fn(),
    } as any;
  }

  private createMockPanel(
    id: string,
    position: vscode.ViewColumn
  ): vscode.WebviewPanel {
    const mockWebview = {
      html: "",
      options: {},
      cspSource: "vscode-webview:",
      postMessage: jest.fn(),
      onDidReceiveMessage: jest.fn(),
      asWebviewUri: jest.fn(),
    };

    return {
      title: `Mock Panel ${id}`,
      viewType: "mockPanel",
      webview: mockWebview,
      options: {},
      viewColumn: position,
      active: true,
      visible: true,
      onDidDispose: jest.fn(),
      onDidChangeViewState: jest.fn(),
      reveal: jest.fn(),
      dispose: jest.fn(),
    } as any;
  }
}
