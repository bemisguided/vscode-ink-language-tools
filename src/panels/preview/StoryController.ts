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

  private model: StoryModel;
  private view: StoryView;
  private isInitialized: boolean = false;

  // Constructor ======================================================================================================

  constructor(view: StoryView, model: StoryModel) {
    this.view = view;
    this.model = model;
  }

  // Public Methods ===================================================================================================

  /**
   * Initializes the controller and sets up event handlers.
   * This should be called after construction.
   */
  public initialize(): void {
    if (this.isInitialized) {
      return;
    }
    console.debug("[StoryController] 👀 Initializing story controller");
    this.setupEventHandlers();
    this.view.initialize();
    this.isInitialized = true;
  }

  // Private Methods ==================================================================================================

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
  private startStory(): void {
    try {
      console.debug("[StoryController] 📖 Starting story");
      // Reset the story state
      this.model.reset();

      // Get initial story content
      const update = this.model.continueStory();

      // Start the story in the view
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
      const update = this.model.selectChoice(index);
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
