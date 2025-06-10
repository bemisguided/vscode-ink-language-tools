import * as vscode from "vscode";
import path from "path";
import { StoryUpdate } from "./types";
import {
  inboundMessages,
  outboundMessages,
  Message,
} from "./messages/StoryMessages";

export class StoryView {
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
    this.webviewPanel.title = `Ink Preview - ${path.basename(fileName)}`;
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
   * @param error - The error message to display
   */
  public showError(error: string): void {
    this.postMessage(outboundMessages.showError, error);
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
    console.debug(`[StoryView] 📩 Posted message: ${command}:`, payload);
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
      const logMessage = `[StoryView] 📥 Received message: ${command}:`;
      console.debug(logMessage, message.payload);
      callback(message.payload);
    };

    // Register the handler with the webview
    this.disposables.push(
      this.webviewPanel.webview.onDidReceiveMessage(handler)
    );
  }

  private setupWebview(): void {
    console.debug("[StoryView] 👀 Initializing preview webview");

    // Register log handler
    this.registerMessageHandler(inboundMessages.log, (payload) => {
      console.debug(`[StoryView] [Webview] ${payload.message}`);
    });
  }
}
