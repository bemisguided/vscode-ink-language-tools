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
import { PreviewHtmlGenerator } from "./PreviewHtmlGenerator";
import { PreviewStateManager } from "./PreviewStateManager";
import { PreviewStoryManager } from "./PreviewStoryManager";
import { ErrorInfo, ErrorSeverity, FunctionStoryEvent } from "./PreviewState";
import { inboundMessages, Message } from "./PreviewMessages";
import { BuildEngine } from "../build/BuildEngine";
import { Deferred } from "../util/deferred";
import { ISuccessfulBuildResult } from "../build/IBuildResult";
// Import all actions
import { AddErrorsAction } from "./actions/AddErrorsAction";
import { AddStoryEventsAction } from "./actions/AddStoryEventsAction";
import { StartStoryAction } from "./actions/StartStoryAction";
import { parseErrorMessage } from "./parseErrorMessage";
import { PreviewAction } from "./PreviewAction";
import { SelectChoiceAction } from "./actions/SelectChoiceAction";

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
  private stateManager: PreviewStateManager;
  private document?: vscode.TextDocument;
  private isInitialized: boolean = false;
  private viewReadyDeferred: Deferred<void> | null = null;

  // Constructor ======================================================================================================

  constructor(
    webviewPanel: vscode.WebviewPanel,
    stateManager = new PreviewStateManager()
  ) {
    this.webviewPanel = webviewPanel;
    this.htmlGenerator = new PreviewHtmlGenerator();
    this.stateManager = stateManager;
    this.setupWebview();
    this.setupMessageHandlers();
    this.setupStateChangeHandler();
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
   * Disposes of the controller and cleans up all resources.
   */
  public dispose(): void {
    console.debug("[PreviewController] 🗑️ Disposing controller");

    if (this.stateManager) {
      this.stateManager.dispose();
    }

    this.disposables.forEach((disposable) => disposable.dispose());
    this.disposables.length = 0;
  }

  // Private Methods ==================================================================================================

  private ensureDocument(): vscode.TextDocument {
    if (!this.document) {
      throw new Error("Document not initialized");
    }
    return this.document;
  }

  /**
   * Creates an action instance from the given data.
   * @param data - The action data
   * @returns The action instance
   */
  private createAction(data: any): PreviewAction {
    if (data.type === StartStoryAction.actionType) {
      return new StartStoryAction();
    }
    if (data.type === SelectChoiceAction.actionType) {
      return new SelectChoiceAction(data.payload.choiceIndex);
    }
    throw new Error(`Unknown action type: ${data.type}`);
  }

  /**
   * Executes a UI action by creating the action instance and applying it.
   * @param action - The action to execute
   */
  private executeAction(data: any): void {
    const actionInstance = this.createAction(data);
    this.stateManager.dispatch(actionInstance);
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
   * Sets up message handlers for webview communication.
   */
  private setupMessageHandlers(): void {
    // Handle webview ready
    this.registerMessageHandler(inboundMessages.ready, () => {
      console.debug("[PreviewController] 📖 Webview ready");
      if (this.viewReadyDeferred) {
        this.viewReadyDeferred.resolve();
        this.viewReadyDeferred = null;
      }
    });

    // Handle all actions
    this.registerMessageHandler(inboundMessages.action, (actionData: any) => {
      this.executeAction(actionData);
    });
  }

  /**
   * Set up the state change handler.
   */
  private setupStateChangeHandler(): void {
    this.stateManager.setOnStateChange((state) => {
      const message: Message = {
        command: "updateState",
        payload: {
          state,
        },
      };
      console.debug("[PreviewController] 📤 Sending state", state);
      this.webviewPanel.webview.postMessage(message);
    });
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
   * Sets the title of the webview panel.
   */
  private setTitle(fileName: string): void {
    this.webviewPanel.title = `${path.basename(fileName)} (Preview)`;
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

    console.debug("[PreviewController] 📖 Starting story");

    // Create PreviewStoryManager and PreviewStateManager with the compiled story
    const storyManager = new PreviewStoryManager(compiledStory.story);
    this.stateManager.storyManager = storyManager;
    this.stateManager.reset();

    // Set up story error handler
    compiledStory.story.onError = (error) => {
      const { message, severity } = parseErrorMessage(error.toString());
      this.stateManager.dispatch(
        new AddErrorsAction([{ message, severity: severity || "error" }])
      );
    };

    // Bind external functions directly - no model needed
    this.bindAllExternalFunctions(compiledStory);

    // Start the story
    this.stateManager.dispatch(new StartStoryAction());
  }

  /**
   * Adds an error to the state.
   * @param message - The error message
   * @param severity - The error severity
   */
  private addErrorToState(message: string, severity: ErrorSeverity): void {
    const error: ErrorInfo = { message, severity };
    this.stateManager?.dispatch(new AddErrorsAction([error]));
  }

  /**
   * Handles compilation errors by initializing state with error.
   * @param message - The compilation error message
   */
  private handleCompilationError(message: string): void {
    // Reset state manager for error handling (no story available)
    this.stateManager.reset();

    // Add compilation error to state
    this.addErrorToState(message, "error");
  }

  /**
   * Binds all external functions to the story.
   * @param compiledStory - The compiled story result
   */
  private bindAllExternalFunctions(
    compiledStory: ISuccessfulBuildResult
  ): void {
    if (!compiledStory.externalFunctionVM) {
      return;
    }

    const availableFunctions =
      compiledStory.externalFunctionVM.getFunctionNames();

    if (availableFunctions.length === 0) {
      return;
    }

    const failedBindings = compiledStory.externalFunctionVM.bindFunctions(
      compiledStory.story,
      availableFunctions,
      (functionName, args, result) => {
        // Dispatch AddStoryEventsAction immediately
        const functionEvent: FunctionStoryEvent = {
          type: "function",
          functionName,
          args,
          result,
          isCurrent: true,
        };

        this.stateManager?.dispatch(new AddStoryEventsAction([functionEvent]));
      }
    );

    if (failedBindings.length > 0) {
      const errors = failedBindings.map((funcName) => ({
        message: `Failed to bind external function: ${funcName}`,
        severity: "error" as const,
      }));

      this.stateManager?.dispatch(new AddErrorsAction(errors));
    }
  }
}
