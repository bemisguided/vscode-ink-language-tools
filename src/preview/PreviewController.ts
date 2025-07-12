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
import { PreviewModel } from "./PreviewModel";
import { PreviewHtmlGenerator } from "./PreviewHtmlGenerator";
import { StoryUpdate } from "./types";
import { inboundMessages, outboundMessages, Message } from "./PreviewMessages";
import { BuildEngine } from "../build/BuildEngine";
import { Deferred } from "../util/deferred";
import { VSCodeServiceLocator } from "../services/VSCodeServiceLocator";

/**
 * Coordinates the story preview, managing the webview, model, and user interactions.
 */
export class PreviewController {
  // Private Properties ===============================================================================================

  private readonly webviewPanel: vscode.WebviewPanel;
  private readonly htmlGenerator: PreviewHtmlGenerator;
  private readonly disposables: vscode.Disposable[] = [];
  private document?: vscode.TextDocument;
  private model?: PreviewModel;
  private isInitialized: boolean = false;
  private viewReadyDeferred: Deferred<void> | null = null;

  // Constructor ======================================================================================================

  constructor(webviewPanel: vscode.WebviewPanel) {
    this.webviewPanel = webviewPanel;
    this.htmlGenerator = new PreviewHtmlGenerator();
    this.setupWebview();
    this.setupMessageHandlers();
  }

  // Public Methods ===================================================================================================

  /**
   * Initializes the controller and sets up event handlers.
   * This should be called after construction.
   */
  public async preview(document: vscode.TextDocument): Promise<void> {
    this.document = document;

    // Update the preview panel title with the current document name
    this.setTitle(document.uri.fsPath);

    if (this.isInitialized) {
      await this.startStory();
      return;
    }

    this.isInitialized = true;
    this.viewReadyDeferred = new Deferred<void>();
    await this.viewReadyDeferred.promise;
    await this.startStory();
  }

  /**
   * Disposes of all resources used by the controller.
   */
  public dispose(): void {
    this.disposables.forEach((d) => d.dispose());
  }

  // Private Methods ==================================================================================================

  private ensureDocument(): vscode.TextDocument {
    if (!this.document) {
      throw new Error("Document not initialized");
    }
    return this.document;
  }

  private ensureModel(): PreviewModel {
    if (!this.model) {
      throw new Error("PreviewModel not initialized");
    }
    return this.model;
  }

  /**
   * Sets up the webview and initializes its content.
   */
  private setupWebview(): void {
    console.debug("[PreviewController] 👀 Initializing preview webview");
    this.webviewPanel.webview.html = this.htmlGenerator.generateHtml(
      this.webviewPanel.webview
    );
  }

  /**
   * Sets up message handlers for webview communication.
   */
  private setupMessageHandlers(): void {
    // Register log handler
    this.registerMessageHandler(inboundMessages.log, (payload) => {
      console.debug(`[PreviewController] [Webview] ${payload.message}`);
    });

    // Handle webview ready
    this.registerMessageHandler(inboundMessages.ready, () => {
      console.debug("[PreviewController] 📖 Webview ready");
      if (this.viewReadyDeferred) {
        this.viewReadyDeferred.resolve();
        this.viewReadyDeferred = null;
      }
    });

    // Handle choice selection
    this.registerMessageHandler(inboundMessages.selectChoice, (payload) => {
      this.handleChoice(payload.choiceIndex);
    });

    // Handle restart request
    this.registerMessageHandler(inboundMessages.restartStory, () => {
      this.startStory();
    });
  }

  /**
   * Registers a message handler for a specific command.
   */
  private registerMessageHandler(
    command: string,
    callback: (payload: any) => void
  ): void {
    const handler = (message: Message) => {
      if (message.command !== command) {
        return;
      }
      const logMessage = `[PreviewController] 📥 Received message: ${command}:`;
      console.debug(logMessage, message.payload);
      callback(message.payload);
    };

    this.disposables.push(
      this.webviewPanel.webview.onDidReceiveMessage(handler)
    );
  }

  /**
   * Sends a message to the webview.
   */
  private postMessage(command: string, payload: any): void {
    this.webviewPanel.webview.postMessage({
      command,
      payload,
    });
    console.debug(
      `[PreviewController] 📩 Posted message: ${command}:`,
      payload
    );
  }

  /**
   * Sets the title of the webview panel.
   */
  private setTitle(fileName: string): void {
    this.webviewPanel.title = `${path.basename(fileName)} (Preview)`;
  }

  /**
   * Sends a message to start the story in the webview.
   */
  private startStoryInWebview(): void {
    this.postMessage(outboundMessages.startStory, {});
  }

  /**
   * Sends a story update to the webview.
   */
  private updateStoryInWebview(update: StoryUpdate): void {
    this.postMessage(outboundMessages.updateStory, update);
  }

  /**
   * Sends a message to indicate the story has ended.
   */
  private endStoryInWebview(): void {
    this.postMessage(outboundMessages.endStory, {});
  }

  /**
   * Displays an error message in the webview.
   */
  private showErrorInWebview(
    message: string,
    severity: "error" | "warning" | "info" = "error"
  ): void {
    this.postMessage(outboundMessages.showError, { message, severity });
  }

  /**
   * Starts or restarts the story.
   * This is called both on initial start and when the user requests a restart.
   */
  private async startStory(): Promise<void> {
    const document = this.ensureDocument();
    const engine = BuildEngine.getInstance();
    const compiledStory = await engine.compileStory(document.uri);
    if (!compiledStory.success) {
      this.showErrorInWebview(
        "Story had errors and could not be compiled. Review the Problem Panel for more information.",
        "error"
      );
      return;
    }
    // Start the story, with continue story
    console.debug("[PreviewController] 📖 Starting story");
    this.model = new PreviewModel(compiledStory);

    // Register error callback to propagate errors to the webview
    this.model.onError(
      (message: string, severity: "error" | "warning" | "info") => {
        this.showErrorInWebview(message, severity);
      }
    );

    this.model.reset();
    this.startStoryInWebview();
    const update = this.model.continueStory() || {
      hasEnded: false,
      text: "",
      choices: [],
    };
    this.updateView(update);
  }

  /**
   * Handles a choice selection from the user.
   * @param index - The index of the selected choice
   */
  private handleChoice(index: number): void {
    console.debug("[PreviewController] 📖 Selecting choice", index);
    const model = this.ensureModel();

    // Select the choice
    const update = model.selectChoice(index);

    // Update the view
    this.updateView(update);
  }

  /**
   * Updates the view with a story update.
   * If the story has ended, sends an end message.
   * @param update - The story update to display
   */
  private updateView(update: StoryUpdate): void {
    console.debug("[PreviewController] 📖 Updating story");
    this.updateStoryInWebview(update);
    if (update.hasEnded) {
      console.debug("[PreviewController] 📖 Story has ended");
      this.endStoryInWebview();
      return;
    }
  }

  /**
   * Handles errors by displaying them in the webview.
   * @param error - The error to handle
   */
  private handleError(error: unknown): void {
    this.showErrorInWebview(
      error instanceof Error ? error.message : "An unknown error occurred",
      "error"
    );
  }
}
