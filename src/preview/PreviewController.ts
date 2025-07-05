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
import { PreviewModel } from "./PreviewModel";
import { PreviewView } from "./PreviewView";
import { StoryUpdate } from "./types";
import { BuildEngine } from "../build/BuildEngine";
import { Deferred } from "../util/deferred";
import { VSCodeServiceLocator } from "../services/VSCodeServiceLocator";

/**
 * Coordinates between the PreviewModel and PreviewView, managing the story lifecycle
 * and handling user interactions.
 */
export class PreviewController {
  // Private Properties ===============================================================================================

  private document?: vscode.TextDocument;
  private model?: PreviewModel;
  private view: PreviewView;
  private isInitialized: boolean = false;
  private viewReadyDeferred: Deferred<void> | null = null;

  // Constructor ======================================================================================================

  constructor(view: PreviewView) {
    this.view = view;
  }

  // Public Methods ===================================================================================================

  /**
   * Initializes the controller and sets up event handlers.
   * This should be called after construction.
   */
  public async preview(document: vscode.TextDocument): Promise<void> {
    this.document = document;
    if (this.isInitialized) {
      await this.startStory();
      return;
    }

    this.isInitialized = true;
    this.viewReadyDeferred = new Deferred<void>();
    this.setupEventHandlers();
    this.view.initialize();
    await this.viewReadyDeferred.promise;
    await this.startStory();
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
   * Sets up event handlers for user interactions and story events.
   */
  private setupEventHandlers(): void {
    // Handle webview ready
    this.view.onReady(() => {
      console.debug("[PreviewController] 📖 Webview ready");
      if (this.viewReadyDeferred) {
        this.viewReadyDeferred.resolve();
        this.viewReadyDeferred = null;
      }
    });

    // Handle choice selection
    this.view.onChoiceSelected((index: number) => {
      this.handleChoice(index);
    });

    // Handle restart request
    this.view.onRestart(() => {
      this.startStory();
    });
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
      this.view.showError("Compilation failed");
      return;
    }
    // Start the story, with continue story
    console.debug("[PreviewController] 📖 Starting story");
    this.model = new PreviewModel(compiledStory);
    this.model.reset();
    this.view.startStory();
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

    // Handle if there was an error
    if (model.getCurrentError()) {
      this.view.showError(model.getCurrentError());
      return;
    }

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
    this.view.updateStory(update);
    if (update.hasEnded) {
      console.debug("[PreviewController] 📖 Story has ended");
      this.view.endStory();
      return;
    }
  }

  /**
   * Handles errors by displaying them in the view.
   * @param error - The error to handle
   */
  private handleError(error: unknown): void {
    this.view.showError(
      error instanceof Error ? error.message : "An unknown error occurred"
    );
  }
}
