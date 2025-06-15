import * as vscode from "vscode";
import { StoryController } from "./StoryController";
import { StoryView } from "./StoryView";
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

  public initialize(document: vscode.TextDocument) {
    try {
      const view = new StoryView(this.webviewPanel);
      this.controller = new StoryController(view);
      this.controller.initialize(document);
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
          <div id="story-content"></div>
          <div id="choices-container"></div>
          <div id="error-container" class="hidden"></div>
        </div>
        <script src="${jsUrl}"></script>
      </body>
      </html>`;
  }
}
