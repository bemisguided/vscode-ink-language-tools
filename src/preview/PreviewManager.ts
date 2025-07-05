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
import { PreviewController } from "./PreviewController";
import { PreviewView } from "./PreviewView";
import { ExtensionUtils } from "../services/ExtensionUtils";
<<<<<<< HEAD
=======
import { VSCodeServiceLocator } from "../services/VSCodeServiceLocator";
import { BuildEngine } from "../build/BuildEngine";
>>>>>>> 97b6035 (chore: refactor, clean-up, fix poc preview functionality)

export class PreviewManager {
  // Private Static Properties ========================================================================================

  private static instance: PreviewManager | undefined;

  // Private Properties ===============================================================================================

<<<<<<< HEAD
  private webviewPanel: vscode.WebviewPanel | undefined;

  private controller: PreviewController | undefined;
=======
  private readonly webviewPanel: vscode.WebviewPanel;

  private readonly controller: PreviewController;
>>>>>>> 97b6035 (chore: refactor, clean-up, fix poc preview functionality)

  private uri: vscode.Uri | undefined;

  private version: number = 0;

  // Public Static Methods ============================================================================================

  public static getInstance(): PreviewManager {
<<<<<<< HEAD
    if (!PreviewManager.instance) {
      PreviewManager.instance = new PreviewManager();
    }
=======
    const column = vscode.window.activeTextEditor
      ? vscode.ViewColumn.Beside
      : undefined;

    // If we already have a panel, show it
    if (PreviewManager.instance) {
      PreviewManager.instance.webviewPanel.reveal(column);
      return PreviewManager.instance;
    }

    // Otherwise, create a new panel
    console.log("[InkPreviewPanel] Creating new instance");
    PreviewManager.instance = new PreviewManager();
>>>>>>> 97b6035 (chore: refactor, clean-up, fix poc preview functionality)
    return PreviewManager.instance;
  }

  // Constructor ======================================================================================================

<<<<<<< HEAD
  private constructor() {}

  // Private Methods ==================================================================================================

  private ensureController(): PreviewController {
    if (this.controller) {
      return this.controller;
    }
    throw new Error("Controller not initialized");
  }

  private ensureWebviewPanel(): vscode.WebviewPanel {
    if (this.webviewPanel) {
      return this.webviewPanel;
    }
    throw new Error("Webview panel not initialized");
  }

  private initialize() {
    if (this.webviewPanel) {
      return;
    }

=======
  private constructor() {
>>>>>>> 97b6035 (chore: refactor, clean-up, fix poc preview functionality)
    this.webviewPanel = vscode.window.createWebviewPanel(
      "inkPreview",
      "Ink Preview",
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        enableFindWidget: true,
        localResourceRoots: ExtensionUtils.getWebviewLocalResourceRoots(),
      }
    );

<<<<<<< HEAD
=======
    this.webviewPanel.webview.html = this.getWebviewContent();

>>>>>>> 97b6035 (chore: refactor, clean-up, fix poc preview functionality)
    const view = new PreviewView(this.webviewPanel);
    this.controller = new PreviewController(view);

    this.webviewPanel.onDidDispose(() => this.dispose());
  }

  // Public Methods ===================================================================================================

  public async preview(document: vscode.TextDocument) {
    console.log(
<<<<<<< HEAD
      "[PreviewManager] Previewing document",
      document.uri.fsPath,
      this.version
    );
    const hasDocument = this.uri !== undefined;
    const hasDocumentChanged =
      this.uri !== document.uri || this.version !== document.version;
    if (hasDocument && !hasDocumentChanged) {
      console.log(
        "[PreviewManager] Document is the same as the current document"
=======
      "[InkPreviewPanel] Previewing document",
      document.uri.fsPath,
      this.uri?.fsPath,
      this.version,
      document.version
    );
    if (
      this.uri &&
      this.uri === document.uri &&
      this.version === document.version
    ) {
      console.log(
        "[InkPreviewPanel] Document is the same as the current document"
>>>>>>> 97b6035 (chore: refactor, clean-up, fix poc preview functionality)
      );
      return;
    }
    this.uri = document.uri;
    this.version = document.version;
<<<<<<< HEAD
    console.log("[PreviewManager] Previewing controller");
    await this.ensureController().preview(document);
  }

  public reveal() {
    this.initialize();
    this.ensureWebviewPanel().reveal(vscode.ViewColumn.Beside);
  }

  public dispose(): void {
    console.log("[PreviewManager] Disposing");
    this.webviewPanel?.dispose();
=======
    console.log("[InkPreviewPanel] Previewing controller");
    await this.controller.preview(document);
  }

  public dispose(): void {
    console.log("[InkPreviewPanel] Disposing");
    this.webviewPanel.dispose();
    PreviewManager.instance = undefined;
  }

  private getWebviewContent(): string {
    const cssUrl = ExtensionUtils.getWebviewMediaURL(
      this.webviewPanel.webview,
      "preview.css"
    );
    const jsUrl = ExtensionUtils.getWebviewMediaURL(
      this.webviewPanel.webview,
      "preview.js"
    );
    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Ink Story Preview</title>
        <link rel="stylesheet" href="${cssUrl}">
      </head>
      <body>
        <div id="toolbar-container">
          <button id="button-restart">Restart</button>
        </div>
        <div id="story-container">
          <div id="story-content"></div>
          <div id="choices-container"></div>
          <div id="error-container" class="hidden"></div>
        </div>
        <script src="${jsUrl}"></script>
      </body>
      </html>`;
>>>>>>> 97b6035 (chore: refactor, clean-up, fix poc preview functionality)
  }
}
