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
import { VSCodeServiceLocator } from "../services/VSCodeServiceLocator";

/**
 * Helper class for generating HTML content for the preview webview.
 */
export class PreviewHtmlGenerator {
  /**
   * Generates the complete HTML content for the preview webview.
   * @param webview - The webview instance to generate resource URIs for
   * @returns The complete HTML content as a string
   */
  public generateHtml(webview: vscode.Webview): string {
    const extensionService = VSCodeServiceLocator.getExtensionService();
    const cssUrl = extensionService.getWebviewMediaUri(webview, "preview.css");
    const jsUrl = extensionService.getWebviewMediaUri(webview, "preview.js");
    const errorIconUrl = extensionService.getWebviewMediaUri(
      webview,
      "error-icon.svg"
    );
    const warningIconUrl = extensionService.getWebviewMediaUri(
      webview,
      "warning-icon.svg"
    );
    const infoIconUrl = extensionService.getWebviewMediaUri(
      webview,
      "info-icon.svg"
    );
    const restartIconUrl = extensionService.getWebviewMediaUri(
      webview,
      "restart-icon.svg"
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
          <button id="button-restart" class="btn btn-toolbar" title="Restart story">
            <span class="restart-icon icon"></span>
            Restart
          </button>
          <div id="error-indicators" class="error-indicators">
            <button id="button-errors-error" class="btn btn-toolbar error-indicator" style="display: none;">
              <span class="error-indicator-icon icon error-icon-error"></span>
              <span id="error-count-error" class="error-count">0</span>
            </button>
            <button id="button-errors-warning" class="btn btn-toolbar error-indicator" style="display: none;">
              <span class="error-indicator-icon icon error-icon-warning"></span>
              <span id="error-count-warning" class="error-count">0</span>
            </button>
            <button id="button-errors-info" class="btn btn-toolbar error-indicator" style="display: none;">
              <span class="error-indicator-icon icon error-icon-info"></span>
              <span id="error-count-info" class="error-count">0</span>
            </button>
          </div>
        </div>
        <div id="story-container">
          <div id="story-content"></div>
          <div id="choices-container"></div>
          <div id="error-modal" class="error-modal hidden">
            <div class="error-modal-overlay"></div>
            <div class="error-modal-content">
              <div class="error-modal-header">
                <h3>Issues</h3>
                <button id="close-error-modal" class="btn btn-list close-button">×</button>
              </div>
              <div id="error-list" class="error-list">
                <!-- Errors populated dynamically -->
              </div>
            </div>
          </div>
        </div>
        <script>
          window.svgIcons = {
            error: "${errorIconUrl}",
            warning: "${warningIconUrl}",
            info: "${infoIconUrl}",
            restart: "${restartIconUrl}"
          };
        </script>
        <script src="${jsUrl}"></script>
      </body>
      </html>`;
  }
}
