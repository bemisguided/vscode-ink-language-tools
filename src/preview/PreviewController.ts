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
import { PreviewStateManager } from "./PreviewStateManager";
import { PreviewState } from "./PreviewState";
import { ErrorInfo } from "./ErrorInfo";
import { inboundMessages, Message } from "./PreviewMessages";
import { BuildEngine } from "../build/BuildEngine";
import { Deferred } from "../util/deferred";
import { StoryUpdate } from "./types";

// Import all actions
import { StartStoryAction } from "./actions/StartStoryAction";
import { EndStoryAction } from "./actions/EndStoryAction";
import { AddStoryEventsAction } from "./actions/AddStoryEventsAction";
import { SetCurrentChoicesAction } from "./actions/SetCurrentChoicesAction";
import { AddErrorsAction } from "./actions/AddErrorsAction";
import { InitializeStoryAction } from "./actions/InitializeStoryAction";

/**
 * Coordinates the story preview, managing the webview, state manager, and user interactions.
 * Uses the Full State Replacement Pattern where the complete state is sent to the webview
 * instead of individual update messages.
 */
export class PreviewController {
  // Private Properties ===============================================================================================

  private readonly webviewPanel: vscode.WebviewPanel;
  private readonly htmlGenerator: PreviewHtmlGenerator;
  private readonly disposables: vscode.Disposable[] = [];
  private readonly stateManager: PreviewStateManager;
  private document?: vscode.TextDocument;
  private model?: PreviewModel;
  private isInitialized: boolean = false;
  private viewReadyDeferred: Deferred<void> | null = null;

  // Constructor ======================================================================================================

  constructor(webviewPanel: vscode.WebviewPanel) {
    this.webviewPanel = webviewPanel;
    this.htmlGenerator = new PreviewHtmlGenerator();
    this.stateManager = new PreviewStateManager({
      metadata: {
        title: "",
        fileName: "",
      },
    });
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
    this.stateManager?.dispose();
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

  private ensureStateManager(): PreviewStateManager {
    return this.stateManager;
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
   * Sends the complete state to the webview.
   * This replaces individual message sending with full state replacement.
   */
  private sendStateToWebview(state: PreviewState): void {
    this.webviewPanel.webview.postMessage({
      command: "updateState",
      payload: state,
    });
    console.debug(
      `[PreviewController] 📩 Sent complete state to webview:`,
      state
    );
  }

  /**
   * Sets the title of the webview panel.
   */
  private setTitle(fileName: string): void {
    this.webviewPanel.title = `${path.basename(fileName)} (Preview)`;
  }

  /**
   * Processes a story update by applying it to state via actions and sending to webview.
   * This method handles the common pattern of:
   * 1. Adding story events (if any)
   * 2. Setting current choices
   * 3. Handling story end state
   * 4. Sending updated state to webview
   *
   * @param storyUpdate - The story update from the model
   */
  private processStoryUpdate(storyUpdate: StoryUpdate): void {
    const stateManager = this.ensureStateManager();

    // 1. Add story events if any
    if (storyUpdate.events.length > 0) {
      stateManager.dispatch(new AddStoryEventsAction(storyUpdate.events));
    }

    // 2. Set current choices
    stateManager.dispatch(new SetCurrentChoicesAction(storyUpdate.choices));

    // 3. Handle story end if applicable
    if (storyUpdate.hasEnded) {
      stateManager.dispatch(new EndStoryAction());
    }

    // 4. Send updated state to webview
    this.sendStateToWebview(stateManager.getState());
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
      // Handle compilation failure by showing error
      this.handleCompilationError(
        "Story had errors and could not be compiled. Review the Problem Panel for more information."
      );
      return;
    }

    // Initialize model and state manager
    console.debug("[PreviewController] 📖 Starting story");
    this.model = new PreviewModel(compiledStory);

    // Reset state manager with story metadata
    const fileName = path.basename(document.uri.fsPath);
    this.stateManager.dispatch(
      new InitializeStoryAction(fileName, document.uri.fsPath)
    );

    // Register error callback from model to add errors to state
    this.model.onError(
      (message: string, severity: "error" | "warning" | "info") => {
        this.addErrorToState(message, severity);
      }
    );

    // Reset model and start story workflow
    this.model.reset();

    // Start the story workflow using actions
    const stateManager = this.ensureStateManager();

    // 1. Start story (clears previous state)
    stateManager.dispatch(new StartStoryAction());

    // 2. Continue story and process the update
    const storyUpdate = this.model.continueStory();
    this.processStoryUpdate(storyUpdate);
  }

  /**
   * Handles a choice selection from the user.
   * @param index - The index of the selected choice
   */
  private handleChoice(index: number): void {
    console.debug("[PreviewController] 📖 Selecting choice", index);
    const model = this.ensureModel();

    // Select the choice and process the resulting update
    const storyUpdate = model.selectChoice(index);
    this.processStoryUpdate(storyUpdate);
  }

  /**
   * Adds an error to the state.
   * @param message - The error message
   * @param severity - The error severity
   */
  private addErrorToState(
    message: string,
    severity: "error" | "warning" | "info"
  ): void {
    const stateManager = this.ensureStateManager();
    const error: ErrorInfo = { message, severity };
    stateManager.dispatch(new AddErrorsAction([error]));

    // Send updated state to webview
    this.sendStateToWebview(stateManager.getState());
  }

  /**
   * Handles compilation errors by initializing state with error.
   * @param message - The compilation error message
   */
  private handleCompilationError(message: string): void {
    const document = this.ensureDocument();
    const fileName = path.basename(document.uri.fsPath);

    // Reset state manager with error metadata
    this.stateManager.dispatch(
      new InitializeStoryAction(fileName, document.uri.fsPath)
    );

    // Add compilation error to state
    this.addErrorToState(message, "error");
  }
}
