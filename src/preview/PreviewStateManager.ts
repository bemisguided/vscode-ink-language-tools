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

import { Story } from "inkjs";
import { PreviewState } from "./PreviewState";
import { StoryState } from "./StoryState";
import { UIState } from "./UIState";
import { PreviewAction } from "./PreviewAction";
import { StoryAction } from "./StoryAction";
import { UIAction } from "./actions/UIAction";
import { StoryActionContext } from "./StoryActionContext";
import { UIActionContext } from "./UIActionContext";
import { PreviewStoryManager } from "./PreviewStoryManager";

/**
 * Represents a single entry in the action history.
 * Generic to support both story and UI state tracking.
 */
export interface HistoryEntry<T = PreviewState> {
  action: PreviewAction;
  timestamp: number;
  stateBefore: T;
  stateAfter: T;
}

/**
 * Manages the complete state of the preview system using immutable state updates.
 * Processes actions through the apply() method pattern and maintains the single source of truth
 * for all preview data using the Full State Replacement Pattern.
 *
 * Also provides history tracking and replay functionality for undo/redo operations.
 */
export class PreviewStateManager {
  // Private Properties ===============================================================================================

  private storyState!: StoryState; // Assigned in constructor via initializeDualState()
  private uiState!: UIState; // Assigned in constructor via initializeDualState()
  private storyHistory: HistoryEntry<StoryState>[] = [];
  private uiHistory: HistoryEntry<UIState>[] = [];
  private story?: Story;
  private storyManager?: PreviewStoryManager;
  private maxHistorySize = 100; // Configurable history limit

  // State change callbacks - simple notification pattern
  private onStoryStateChange?: () => void;
  private onUIStateChange?: () => void;

  // Action types that require a story instance to be available
  private static readonly storyDependentActions = new Set([
    "INITIALIZE_STORY",
    "CONTINUE_STORY",
    "SELECT_CHOICE",
  ]);

  // Constructor ======================================================================================================

  /**
   * Creates a new PreviewStateManager with the specified initial state.
   * @param initialState - Partial initial state to merge with defaults
   */
  constructor(initialState?: Partial<PreviewState>) {
    // Initialize dual state from default state structure
    const defaultState = this.createDefaultState(initialState);
    this.initializeDualState(defaultState);
  }

  // Public Methods ===================================================================================================

  /**
   * Dispatches an action to update the state and/or perform side effects.
   * Routes actions to domain-specific handlers based on type guards.
   *
   * @param action - The action to dispatch (StoryAction or UIAction)
   * @returns The new unified state after applying the action
   */
  public dispatch(action: PreviewAction): PreviewState {
    // Check if action requires story and ensure it's available
    if (
      PreviewStateManager.storyDependentActions.has(action.type) &&
      !this.hasStory()
    ) {
      throw new Error(
        `Cannot dispatch story-dependent action '${action.type}': No story available`
      );
    }

    // Route to domain-specific handlers based on action type
    if (this.isStoryAction(action)) {
      this.dispatchStoryAction(action);
    } else if (this.isUIAction(action)) {
      this.dispatchUIAction(action);
    } else {
      console.warn(`[PreviewStateManager] Unknown action type: ${action.type}`);
    }

    return this.getState();
  }

  /**
   * Gets the current story state.
   * @returns A copy of the current story state
   */
  public getStoryState(): StoryState {
    return { ...this.storyState };
  }

  /**
   * Gets the current UI state.
   * @returns A copy of the current UI state
   */
  public getUIState(): UIState {
    return { ...this.uiState };
  }

  /**
   * Gets the complete current state.
   * @returns A copy of the current state with dual structure
   */
  public getState(): PreviewState {
    return {
      story: this.getStoryState(),
      ui: this.getUIState(),
    };
  }

  /**
   * Sets the story instance for side effects.
   * @param story - The Ink story instance
   */
  public setStory(story: Story): void {
    this.story = story;
    this.storyManager = new PreviewStoryManager(story);
  }

  /**
   * Gets the story instance.
   * @returns The Ink story instance
   */
  public getStory(): Story | undefined {
    return this.story;
  }

  /**
   * Checks if a story instance is available.
   * @returns True if a story is available, false otherwise
   */
  public hasStory(): boolean {
    return this.story !== undefined && this.storyManager !== undefined;
  }

  /**
   * Gets the story history.
   * @returns A copy of the story history
   */
  public getStoryHistory(): HistoryEntry<StoryState>[] {
    return [...this.storyHistory];
  }

  /**
   * Gets the UI history.
   * @returns A copy of the UI history
   */
  public getUIHistory(): HistoryEntry<UIState>[] {
    return [...this.uiHistory];
  }

  /**
   * Replays the story history up to a specific point.
   * This is useful for story undo operations.
   *
   * @param toIndex - The index to replay to (exclusive). If not provided, replays all story history
   * @returns The state after story replay
   */
  public replayStoryState(toIndex?: number): PreviewState {
    const endIndex = toIndex ?? this.storyHistory.length;

    if (endIndex < 0 || endIndex > this.storyHistory.length) {
      throw new Error(`Invalid story replay index: ${endIndex}`);
    }

    // Reset story state to initial, preserve UI state
    const defaultState = this.createDefaultState();
    this.storyState = defaultState.story;
    const originalStoryHistory = [...this.storyHistory];
    this.storyHistory = [];

    // Replay story actions up to the target index
    for (let i = 0; i < endIndex; i++) {
      const entry = originalStoryHistory[i];
      this.dispatchStoryAction(entry.action as StoryAction);
    }

    return this.getState();
  }

  /**
   * Undoes the last story action by replaying story history without the last entry.
   * @returns The state after story undo, or current state if no story history
   */
  public undoStoryState(): PreviewState {
    if (this.storyHistory.length === 0) {
      return this.getState();
    }

    return this.replayStoryState(this.storyHistory.length - 1);
  }

  /**
   * Undoes story actions back to the last occurrence of a specific action type.
   * Replays story history up to (but not including) the last occurrence of the action type.
   * If no action of the specified type is found, replays to the beginning.
   *
   * @param actionType - The action type identifier to search for
   * @returns The state after undoing to the last occurrence of the action type
   */
  public undoStoryStateToLast(actionType: string): PreviewState {
    // Find the last occurrence of the action type in story history
    let lastIndex = -1;
    for (let i = this.storyHistory.length - 1; i >= 0; i--) {
      if (this.storyHistory[i].action.type === actionType) {
        lastIndex = i;
        break;
      }
    }

    // If no action of this type found, replay to the beginning
    if (lastIndex === -1) {
      return this.replayStoryState(0);
    }

    // Replay up to (but not including) the last occurrence
    return this.replayStoryState(lastIndex);
  }

  /**
   * Rewinds the story back to before the last choice selection.
   * This goes back to the state before the last SelectChoiceAction was applied.
   * If no SelectChoiceAction exists in the story history, rewinds to the beginning.
   *
   * @returns The state after rewinding to before the last choice
   */
  public rewindStoryStateToLastChoice(): PreviewState {
    return this.undoStoryStateToLast("SELECT_CHOICE");
  }

  /**
   * Resets the state to the initial default state.
   * Preserves metadata if it was set during construction.
   * Clears all histories.
   */
  public reset(): void {
    const defaultState = this.createDefaultState();
    this.initializeDualState(defaultState);
    this.storyHistory = [];
    this.uiHistory = [];
  }

  /**
   * Sets the callback function for story state changes.
   * @param callback - Function to call when story state changes (no parameters)
   */
  public setOnStoryStateChange(callback: () => void): void {
    this.onStoryStateChange = callback;
  }

  /**
   * Sets the callback function for UI state changes.
   * @param callback - Function to call when UI state changes (no parameters)
   */
  public setOnUIStateChange(callback: () => void): void {
    this.onUIStateChange = callback;
  }

  /**
   * Sends the current story state to registered listeners.
   * Triggers the story state change callback if set (simple notification).
   */
  public sendStoryState(): void {
    if (this.onStoryStateChange) {
      this.onStoryStateChange();
    }
  }

  /**
   * Sends the current UI state to registered listeners.
   * Triggers the UI state change callback if set (simple notification).
   */
  public sendUIState(): void {
    if (this.onUIStateChange) {
      this.onUIStateChange();
    }
  }

  /**
   * Disposes of the state manager and cleans up resources.
   */
  public dispose(): void {
    // Clear state for garbage collection
    const defaultState = this.createDefaultState();
    this.initializeDualState(defaultState);
    this.storyHistory = [];
    this.uiHistory = [];
    this.story = undefined;
  }

  // Private Methods ==================================================================================================

  /**
   * Adds an entry to the story history.
   * Maintains the maximum history size by removing old entries.
   * @param entry - The story history entry to add
   */
  private addToStoryHistory(entry: HistoryEntry<StoryState>): void {
    this.storyHistory.push(entry);

    // Maintain maximum history size
    if (this.storyHistory.length > this.maxHistorySize) {
      this.storyHistory.shift();
    }
  }

  /**
   * Adds an entry to the UI history.
   * Maintains the maximum history size by removing old entries.
   * @param entry - The UI history entry to add
   */
  private addToUIHistory(entry: HistoryEntry<UIState>): void {
    this.uiHistory.push(entry);

    // Maintain maximum history size
    if (this.uiHistory.length > this.maxHistorySize) {
      this.uiHistory.shift();
    }
  }

  /**
   * Type guard to check if an action is a StoryAction.
   * @param action - The action to check
   * @returns True if the action is a StoryAction
   */
  private isStoryAction(action: PreviewAction): action is StoryAction {
    // Check for story category marker
    return (action as any).category === "story";
  }

  /**
   * Type guard to check if an action is a UIAction.
   * @param action - The action to check
   * @returns True if the action is a UIAction
   */
  private isUIAction(action: PreviewAction): action is UIAction {
    // Check for UI category marker
    return (action as any).category === "ui";
  }

  /**
   * Dispatches a story action using story domain context and tracking.
   * @param action - The story action to dispatch
   */
  private dispatchStoryAction(action: StoryAction): void {
    console.debug(
      `[PreviewStateManager] 📖 Dispatching story action: ${action.type}`
    );

    const stateBefore = { ...this.storyState };
    const context = this.createStoryContext();

    // Apply the action
    action.apply(context);

    // Record in story history if state changed
    if (this.storyState !== stateBefore) {
      this.addToStoryHistory({
        action,
        timestamp: Date.now(),
        stateBefore,
        stateAfter: { ...this.storyState },
      });
    }
  }

  /**
   * Dispatches a UI action using UI domain context and tracking.
   * @param action - The UI action to dispatch
   */
  private dispatchUIAction(action: UIAction): void {
    const stateBefore = { ...this.uiState };
    const context = this.createUIContext();

    // Apply the action
    action.apply(context);

    // Record in UI history if state changed
    if (this.uiState !== stateBefore) {
      this.addToUIHistory({
        action,
        timestamp: Date.now(),
        stateBefore,
        stateAfter: { ...this.uiState },
      });
    }
  }

  /**
   * Creates a story action context for story domain actions.
   * @returns StoryActionContext with story state access and operations
   */
  private createStoryContext(): StoryActionContext {
    return {
      getState: () => this.getStoryState(),
      setState: (newState: StoryState) => {
        this.storyState = newState;
      },
      dispatch: (action: PreviewAction) => {
        this.dispatch(action);
      },
      storyManager: this.storyManager!,
      sendStoryState: () => {
        this.sendStoryState();
      },
    };
  }

  /**
   * Creates a UI action context for UI domain actions.
   * @returns UIActionContext with UI state access and coordination capabilities
   */
  private createUIContext(): UIActionContext {
    return {
      getState: () => this.getUIState(),
      setState: (newState: UIState) => {
        this.uiState = newState;
      },
      dispatch: (action: PreviewAction) => {
        this.dispatch(action);
      },
      rewindStoryToLastChoice: () => {
        this.rewindStoryStateToLastChoice();
      },
      sendStoryState: () => {
        this.sendStoryState();
      },
      sendUIState: () => {
        this.sendUIState();
      },
    };
  }

  /**
   * Initializes the dual state properties from a PreviewState structure.
   * @param state - PreviewState containing story and ui state
   */
  private initializeDualState(state: PreviewState): void {
    this.storyState = state.story;
    this.uiState = state.ui;
  }

  /**
   * Creates the default state structure with optional overrides.
   * @param overrides - Partial state to override defaults
   * @returns Complete default state
   */
  private createDefaultState(overrides?: Partial<PreviewState>): PreviewState {
    const defaultState: PreviewState = {
      story: {
        storyEvents: [],
        currentChoices: [],
        errors: [],
        isEnded: false,
        isStart: true,
        lastChoiceIndex: 0,
      },
      ui: {
        rewind: false,
      },
    };

    if (overrides) {
      return {
        ...defaultState,
        story: {
          ...defaultState.story,
          ...overrides.story,
        },
        ui: {
          ...defaultState.ui,
          ...overrides.ui,
        },
      };
    }

    return defaultState;
  }
}
