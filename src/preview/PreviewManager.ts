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
import { VSCodeServiceLocator } from "../services/VSCodeServiceLocator";

export class PreviewManager {
  // Private Static Properties ========================================================================================

  private static instance: PreviewManager | undefined;

  // Private Properties ===============================================================================================

  private readonly webviewPanel: vscode.WebviewPanel;

  private readonly controller: PreviewController;

  private uri: vscode.Uri | undefined;

  private version: number = 0;

  // Public Static Methods ============================================================================================

  public static getInstance(): PreviewManager {
    const column = vscode.window.activeTextEditor
      ? vscode.ViewColumn.Beside
      : undefined;

    // If we already have a panel, show it
    if (PreviewManager.instance) {
      PreviewManager.instance.webviewPanel.reveal(column);
      return PreviewManager.instance;
    }

    // Otherwise, create a new panel
    PreviewManager.instance = new PreviewManager();
    return PreviewManager.instance;
  }

  // Constructor ======================================================================================================

  private constructor() {
    this.webviewPanel = vscode.window.createWebviewPanel(
      "inkPreview",
      "Ink Preview",
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        enableFindWidget: true,
        localResourceRoots:
          VSCodeServiceLocator.getExtensionService().getWebviewLocalResourceRoots(),
      }
    );

    // Set the icon for the webview panel
    this.webviewPanel.iconPath =
      VSCodeServiceLocator.getExtensionService().getIconUri("ink.png");

    this.controller = new PreviewController(this.webviewPanel);

    this.webviewPanel.onDidDispose(() => this.dispose());
  }

  // Public Methods ===================================================================================================

  public async preview(document: vscode.TextDocument) {
    if (
      this.uri &&
      this.uri === document.uri &&
      this.version === document.version
    ) {
      return;
    }
    this.uri = document.uri;
    this.version = document.version;
    await this.controller.preview(document);
  }

  public dispose(): void {
    this.controller.dispose();
    this.webviewPanel.dispose();
    PreviewManager.instance = undefined;
  }
}
