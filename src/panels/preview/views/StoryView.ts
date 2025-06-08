import * as vscode from "vscode";
import { StoryState, StoryUpdate } from "../models/StoryState";
import { Uri } from "vscode";
import path from "path";

export class StoryView {
  private readonly webview: vscode.WebviewPanel;
  private readonly disposables: vscode.Disposable[] = [];
  private readonly extensionUri: vscode.Uri;

  constructor(extensionUri: vscode.Uri) {
    this.extensionUri = extensionUri;
    this.webview = vscode.window.createWebviewPanel(
      "inkPreview",
      "Ink Story Preview",
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, "media"),
          vscode.Uri.joinPath(extensionUri, "out"),
        ],
      }
    );

    this.setupWebview();
  }

  public updateStory(update: StoryUpdate, functionCalls: any[]): void {
    this.webview.webview.postMessage({
      command: "updateStory",
      text: update.text,
      tags: update.tags,
      choices: update.choices,
      hasEnded: update.hasEnded,
      functionCalls,
    });
  }

  public showError(error: string): void {
    this.webview.webview.postMessage({
      command: "showError",
      error,
    });
  }

  public clearStory(): void {
    this.webview.webview.postMessage({
      command: "clearStory",
    });
  }

  public onChoiceSelected(callback: (index: number) => void): void {
    this.disposables.push(
      this.webview.webview.onDidReceiveMessage((message) => {
        if (message.command === "makeChoice") {
          callback(message.choiceIndex);
        }
      })
    );
  }

  public onRestart(callback: () => void): void {
    this.disposables.push(
      this.webview.webview.onDidReceiveMessage((message) => {
        if (message.command === "restart") {
          callback();
        }
      })
    );
  }

  public reveal(column?: vscode.ViewColumn): void {
    this.webview.reveal(column);
  }

  public dispose(): void {
    this.disposables.forEach((d) => d.dispose());
    this.webview.dispose();
  }

  private setupWebview(): void {
    // Set webview content
    this.webview.webview.html = this.getWebviewContent();

    // Handle webview messages
    this.webview.webview.onDidReceiveMessage(
      (message) => {
        switch (message.command) {
          case "ready":
            // Webview is ready
            break;
          default:
            // Handle unknown commands
            break;
        }
      },
      null,
      this.disposables
    );
  }

  private getWebviewContent(): string {
    return `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Ink Story Preview</title>
        <link rel="stylesheet" href="${this.getMediaUri("preview.css")}">
      </head>
      <body>
        <div id="story-container">
          <div id="story-content"></div>
          <div id="choices-container"></div>
          <div id="error-container" class="hidden"></div>
          <button id="restart-btn" class="hidden">Restart Story</button>
          <div id="debug-container" class="hidden"></div>
        </div>
        <script src="${this.getMediaUri("preview.js")}"></script>
      </body>
      </html>`;
  }

  public getMediaUri(fileName: string): string {
    const mediaUri = Uri.joinPath(
      Uri.file(path.join(this.extensionUri.fsPath, "media")),
      fileName
    );
    return this.webview.webview.asWebviewUri(mediaUri).toString();
  }
}
