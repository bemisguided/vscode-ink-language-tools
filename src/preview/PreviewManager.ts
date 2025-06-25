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

export class PreviewManager {
  // Private Static Properties ========================================================================================

  private static instance: PreviewManager | undefined;

  // Private Properties ===============================================================================================

  private webviewPanel: vscode.WebviewPanel | undefined;

  private controller: PreviewController | undefined;

  private uri: vscode.Uri | undefined;

  private version: number = 0;

  // Public Static Methods ============================================================================================

  public static getInstance(): PreviewManager {
    if (!PreviewManager.instance) {
      PreviewManager.instance = new PreviewManager();
    }
    return PreviewManager.instance;
  }

  // Constructor ======================================================================================================

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

    const view = new PreviewView(this.webviewPanel);
    this.controller = new PreviewController(view);

    this.webviewPanel.onDidDispose(() => this.dispose());
  }

  // Public Methods ===================================================================================================

  public async preview(document: vscode.TextDocument) {
    console.log(
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
      );
      return;
    }
    this.uri = document.uri;
    this.version = document.version;
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
  }
}
