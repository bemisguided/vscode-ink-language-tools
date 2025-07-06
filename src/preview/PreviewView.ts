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
import path from "path";
import { StoryUpdate } from "./types";
import { inboundMessages, outboundMessages, Message } from "./PreviewMessages";
import { VSCodeServiceLocator } from "../services/VSCodeServiceLocator";

export class PreviewView {
  // Private Properties ===============================================================================================

  private readonly webviewPanel: vscode.WebviewPanel;
  private readonly disposables: vscode.Disposable[] = [];

  // Constructor ======================================================================================================
  constructor(webviewPanel: vscode.WebviewPanel) {
    this.webviewPanel = webviewPanel;
  }

  // Public Methods ===================================================================================================

  /**
   * Initializes the webview and sets up message handlers.
   * This should be called after construction and before any other methods.
   */
  public initialize(): void {
    this.setupWebview();
  }

  /**
   * Sets the title of the webview panel to include the current file name.
   * @param fileName - The full path of the current file
   */
  public setTitle(fileName: string): void {
    this.webviewPanel.title = `${path.basename(fileName)} (Preview)`;
  }

  /**
   * Sends a message to start the story in the webview.
   * This should be called after receiving the ready message from the webview.
   */
  public startStory(): void {
    this.postMessage(outboundMessages.startStory, {});
  }

  /**
   * Sends a story update to the webview.
   * This includes new events, choices, and story state.
   * @param update - The story update containing events, choices, and end state
   */
  public updateStory(update: StoryUpdate): void {
    this.postMessage(outboundMessages.updateStory, update);
  }

  /**
   * Sends a message to indicate the story has ended.
   * This should be called when the story reaches a final state.
   */
  public endStory(): void {
    this.postMessage(outboundMessages.endStory, {});
  }

  /**
   * Displays an error message in the webview.
   * @param message - The error message to display
   * @param severity - The severity level of the error
   */
  public showError(
    message: string,
    severity: "error" | "warning" | "info" = "error"
  ): void {
    this.postMessage(outboundMessages.showError, { message, severity });
  }

  /**
   * Registers a callback for when the webview is ready to receive messages.
   * @param callback - Function to call when the webview sends the ready message
   */
  public onReady(callback: () => void): void {
    this.registerMessageHandler(inboundMessages.ready, callback);
  }

  /**
   * Registers a callback for when the player selects a choice.
   * @param callback - Function to call with the selected choice index
   */
  public onChoiceSelected(callback: (index: number) => void): void {
    this.registerMessageHandler(inboundMessages.selectChoice, (payload) => {
      callback(payload.choiceIndex);
    });
  }

  /**
   * Registers a callback for when the player requests a story restart.
   * @param callback - Function to call when restart is requested
   */
  public onRestart(callback: () => void): void {
    this.registerMessageHandler(inboundMessages.restartStory, callback);
  }

  /**
   * Disposes of all resources used by the view.
   * This should be called when the view is no longer needed.
   */
  public dispose(): void {
    this.disposables.forEach((d) => d.dispose());
    this.webviewPanel.dispose();
  }

  // Private Methods ==================================================================================================

  private postMessage(command: string, payload: any): void {
    this.webviewPanel.webview.postMessage({
      command,
      payload,
    });
    console.debug(`[PreviewView] 📩 Posted message: ${command}:`, payload);
  }

  private registerMessageHandler(
    command: string,
    callback: (payload: any) => void
  ): void {
    // Create a handler function that checks the command and calls the callback
    const handler = (message: Message) => {
      if (message.command !== command) {
        return;
      }
      const logMessage = `[PreviewView] 📥 Received message: ${command}:`;
      console.debug(logMessage, message.payload);
      callback(message.payload);
    };

    // Register the handler with the webview
    this.disposables.push(
      this.webviewPanel.webview.onDidReceiveMessage(handler)
    );
  }

  private setupWebview(): void {
    console.debug("[PreviewView] 👀 Initializing preview webview");

    // Register log handler
    this.registerMessageHandler(inboundMessages.log, (payload) => {
      console.debug(`[PreviewView] [Webview] ${payload.message}`);
    });

    this.webviewPanel.webview.html = this.getWebviewContent();
  }

  private getWebviewContent(): string {
    const extensionService = VSCodeServiceLocator.getExtensionService();
    const cssUrl = extensionService.getWebviewMediaUri(
      this.webviewPanel.webview,
      "preview.css"
    );
    const jsUrl = extensionService.getWebviewMediaUri(
      this.webviewPanel.webview,
      "preview.js"
    );
    const errorIconUrl = extensionService.getWebviewMediaUri(
      this.webviewPanel.webview,
      "error-icon.svg"
    );
    const warningIconUrl = extensionService.getWebviewMediaUri(
      this.webviewPanel.webview,
      "warning-icon.svg"
    );
    const infoIconUrl = extensionService.getWebviewMediaUri(
      this.webviewPanel.webview,
      "info-icon.svg"
    );
    const restartIconUrl = extensionService.getWebviewMediaUri(
      this.webviewPanel.webview,
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
