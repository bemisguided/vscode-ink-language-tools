import * as vscode from "vscode";
import { StoryController } from "./StoryController";
import { StoryView } from "./StoryView";
import { SuccessfulCompilationResult } from "../../types";
import { StoryModel } from "./StoryModel";
import { ExtensionUtils } from "../../utils/ExtensionUtils";

export class InkPreviewPanel {
  // Private Properties ===============================================================================================

  private static singleton: InkPreviewPanel | undefined;
  private webviewPanel: vscode.WebviewPanel;
  private controller: StoryController | undefined;

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
        localResourceRoots: ExtensionUtils.getWebviewLocalResourceRoots(),
      }
    );

    // Set minimal webview content for testing
    // this.webviewPanel.webview.html = `<!DOCTYPE html>
    //   <html>
    //     <head>
    //       <meta charset="UTF-8">
    //       <meta name="viewport" content="width=device-width, initial-scale=1.0">
    //       <meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline' ${this.webviewPanel.webview.cspSource};">
    //     </head>
    //     <body>
    //       <h1>Test Webview</h1>
    //       <div id="output"></div>
    //       <script>
    //         const vscode = acquireVsCodeApi();
    //         const output = document.getElementById('output');

    //         // Log when script loads
    //         console.log('Test script loaded');
    //         output.textContent = 'Script loaded';

    //         // Send ready message
    //         vscode.postMessage({ command: 'ready', payload: {} });
    //         output.textContent += '\\nReady message sent';

    //         // Listen for messages
    //         window.addEventListener('message', event => {
    //           console.log('Message received:', event);
    //           output.textContent += '\\nMessage received: ' + JSON.stringify(event.data);
    //         });
    //       </script>
    //     </body>
    //   </html>`;

    this.webviewPanel.webview.html = this.getWebviewContent();

    this.webviewPanel.onDidDispose(() => this.dispose());
  }

  // Public Methods ===================================================================================================

  public static getInstance(): InkPreviewPanel {
    const column = vscode.window.activeTextEditor
      ? vscode.ViewColumn.Beside
      : undefined;

    // If we already have a panel, show it
    if (InkPreviewPanel.singleton) {
      InkPreviewPanel.singleton.webviewPanel.reveal(column);
      return InkPreviewPanel.singleton;
    }

    // Otherwise, create a new panel
    console.log("[InkPreviewPanel] Creating new instance");
    InkPreviewPanel.singleton = new InkPreviewPanel();
    return InkPreviewPanel.singleton;
  }

  public loadStory(compilationResult: SuccessfulCompilationResult) {
    try {
      const model = new StoryModel(
        compilationResult.story,
        compilationResult.bindableFunctions
      );
      const view = new StoryView(this.webviewPanel);
      this.controller = new StoryController(view, model);
      this.controller.initialize();
    } catch (error) {
      console.error("❌ Failed to load story:", error);
      vscode.window.showErrorMessage(`Failed to load story: ${error}`);
    }
  }

  public dispose(): void {
    console.log("[InkPreviewPanel] Disposing");
    if (this.controller) {
      this.controller = undefined;
    }
    this.webviewPanel.dispose();
    InkPreviewPanel.singleton = undefined;
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
          <div id="output"></div>
          <div id="story-content"></div>
          <div id="choices-container"></div>
          <div id="error-container" class="hidden"></div>
        </div>
        <script src="${jsUrl}"></script>
      </body>
      </html>`;
  }
}
