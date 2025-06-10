import * as vscode from "vscode";
import { StoryModel } from "./StoryModel";
import { StoryView } from "./StoryView";
import { InkStoryManager } from "../../InkStoryManager";
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
    try {
      // Resolve the latest compiled story
      const document = this.ensureDocument();
      const storyManager = InkStoryManager.getInstance();
      const compiledStory = await storyManager.getCompiledStory(document);
      this.model = new StoryModel(compiledStory);

      // Get initial story content
      const update = this.model.continueStory();

      // Start the story in the view
      console.debug("[StoryController] 📖 Starting story");
      this.view.startStory();

      // Update the view with initial content
      this.updateView(update);
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Handles a choice selection from the user.
   * @param index - The index of the selected choice
   */
  private handleChoice(index: number): void {
    try {
      console.debug("[StoryController] 📖 Selecting choice", index);
      const update = this.ensureModel().selectChoice(index);
      this.updateView(update);
    } catch (error) {
      this.handleError(error);
    }
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
