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
import { StoryModel } from "./StoryModel";
import { StoryView } from "./StoryView";
import { StoryUpdate } from "./types";

/**
 * Coordinates between the StoryModel and StoryView, managing the story lifecycle
 * and handling user interactions.
 */
export class StoryController {
  // Private Properties ===============================================================================================

  private document?: vscode.TextDocument;
  private model?: StoryModel;
  private view: StoryView;
  private isInitialized: boolean = false;

  // Constructor ======================================================================================================

  constructor(view: StoryView) {
    this.view = view;
  }

  // Public Methods ===================================================================================================

  /**
   * Initializes the controller and sets up event handlers.
   * This should be called after construction.
   */
  public initialize(document: vscode.TextDocument): void {
    this.document = document;
    if (this.isInitialized) {
      return;
    }
    this.setupEventHandlers();
    this.view.initialize();
    this.isInitialized = true;
  }

  // Private Methods ==================================================================================================

  private ensureDocument(): vscode.TextDocument {
    if (!this.document) {
      throw new Error("Document not initialized");
    }
    return this.document;
  }

  private ensureModel(): StoryModel {
    if (!this.model) {
      throw new Error("StoryModel not initialized");
    }
    return this.model;
  }

  /**
   * Sets up event handlers for user interactions and story events.
   */
  private setupEventHandlers(): void {
    // Handle webview ready
    this.view.onReady(() => {
      this.startStory();
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
    // const document = this.ensureDocument();
    // const storyManager = InkStoryManager.getInstance();
    // const compiledStory = await storyManager.getCompiledStory(document);
    // // Only rebuild model if timestamp is newer or model doesn't exist
    // if (!this.model || compiledStory.timestamp > this.model.getTimestamp()) {
    //   this.model = new StoryModel(compiledStory);
    // }
    // // Start the story, with continue story
    // console.debug("[StoryController] 📖 Starting story");
    // this.model.reset();
    // this.view.startStory();
    // const update = this.model.continueStory();
    // this.updateView(update);
  }

  /**
   * Handles a choice selection from the user.
   * @param index - The index of the selected choice
   */
  private handleChoice(index: number): void {
    console.debug("[StoryController] 📖 Selecting choice", index);
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
    if (update.hasEnded) {
      console.debug("[StoryController] 📖 Story has ended");
      this.view.endStory();
      return;
    }
    console.debug("[StoryController] 📖 Updating story");
    this.view.updateStory(update);
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
