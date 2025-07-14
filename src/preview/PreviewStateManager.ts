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
import { PreviewAction, PreviewActionContext } from "./PreviewAction";

/**
 * Represents a single entry in the action history.
 */
export interface HistoryEntry {
  action: PreviewAction;
  timestamp: number;
  stateBefore: PreviewState;
  stateAfter: PreviewState;
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

  private currentState: PreviewState;
  private actionHistory: HistoryEntry[] = [];
  private story?: Story;
  private isProcessing = false;
  private maxHistorySize = 100; // Configurable history limit

  // Action types that require a story instance to be available
  private static readonly STORY_DEPENDENT_ACTIONS = new Set([
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
    this.currentState = this.createDefaultState(initialState);
  }

  // Public Methods ===================================================================================================

  /**
   * Dispatches an action to update the state and/or perform side effects.
   * Creates a context for the action and calls its apply() method.
   *
   * @param action - The action to dispatch
   * @returns The new state after applying the action
   */
  public dispatch(action: PreviewAction): PreviewState {
    // Check if action requires story and ensure it's available
    if (
      PreviewStateManager.STORY_DEPENDENT_ACTIONS.has(action.type) &&
      !this.hasStory()
    ) {
      throw new Error(
        `Cannot dispatch story-dependent action '${action.type}': No story available`
      );
    }

    if (this.isProcessing) {
      // Prevent infinite recursion during nested dispatches
      // For now, we'll allow nested dispatches but could implement queuing if needed
      this.applyAction(action);
      return this.currentState;
    }

    this.isProcessing = true;

    try {
      const stateBefore = { ...this.currentState };

      // Create context for the action
      const context = this.createActionContext();

      // Apply the action
      action.apply(context);

      // Record in history if state changed
      if (this.currentState !== stateBefore) {
        this.addToHistory({
          action,
          timestamp: Date.now(),
          stateBefore,
          stateAfter: { ...this.currentState },
        });
      }
    } finally {
      this.isProcessing = false;
    }

    return this.currentState;
  }

  /**
   * Gets the current state.
   * @returns A copy of the current state
   */
  public getState(): PreviewState {
    return { ...this.currentState };
  }

  /**
   * Sets the story instance for side effects.
   * @param story - The Ink story instance
   */
  public setStory(story: Story): void {
    this.story = story;
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
    return this.story !== undefined;
  }

  /**
   * Gets the action history.
   * @returns A copy of the action history
   */
  public getHistory(): HistoryEntry[] {
    return [...this.actionHistory];
  }

  /**
   * Replays the action history up to a specific point.
   * This is useful for undo operations.
   *
   * @param toIndex - The index to replay to (exclusive). If not provided, replays all history
   * @returns The state after replay
   */
  public replay(toIndex?: number): PreviewState {
    const endIndex = toIndex ?? this.actionHistory.length;

    if (endIndex < 0 || endIndex > this.actionHistory.length) {
      throw new Error(`Invalid replay index: ${endIndex}`);
    }

    // Clear current state and history beyond the target point
    this.currentState = this.createDefaultState();
    const originalHistory = [...this.actionHistory];
    this.actionHistory = [];

    // Replay actions up to the target index
    for (let i = 0; i < endIndex; i++) {
      const entry = originalHistory[i];
      this.dispatch(entry.action);
    }

    return this.currentState;
  }

  /**
   * Undoes the last action by replaying history without the last entry.
   * @returns The state after undo, or current state if no history
   */
  public undo(): PreviewState {
    if (this.actionHistory.length === 0) {
      return this.currentState;
    }

    return this.replay(this.actionHistory.length - 1);
  }

  /**
   * Undoes actions back to the last occurrence of a specific action type.
   * Replays history up to (but not including) the last occurrence of the action type.
   * If no action of the specified type is found, replays to the beginning.
   *
   * @param actionType - The action type identifier to search for
   * @returns The state after undoing to the last occurrence of the action type
   */
  public undoToLast(actionType: string): PreviewState {
    // Find the last occurrence of the action type
    let lastIndex = -1;
    for (let i = this.actionHistory.length - 1; i >= 0; i--) {
      if (this.actionHistory[i].action.type === actionType) {
        lastIndex = i;
        break;
      }
    }

    // If no action of this type found, replay to the beginning
    if (lastIndex === -1) {
      return this.replay(0);
    }

    // Replay up to (but not including) the last occurrence
    return this.replay(lastIndex);
  }

  /**
   * Rewinds the story back to before the last choice selection.
   * This goes back to the state before the last SelectChoiceAction was applied.
   * If no SelectChoiceAction exists in the history, rewinds to the beginning.
   *
   * @returns The state after rewinding to before the last choice
   */
  public rewindToLastChoice(): PreviewState {
    return this.undoToLast("SELECT_CHOICE");
  }

  /**
   * Clears the action history.
   */
  public clearHistory(): void {
    this.actionHistory = [];
  }

  /**
   * Resets the state to the initial default state.
   * Preserves metadata if it was set during construction.
   * Clears action history.
   */
  public reset(): void {
    this.currentState = this.createDefaultState();
    this.clearHistory();
  }

  /**
   * Disposes of the state manager and cleans up resources.
   */
  public dispose(): void {
    // Clear state for garbage collection
    this.currentState = this.createDefaultState();
    this.actionHistory = [];
    this.story = undefined;
  }

  // Private Methods ==================================================================================================

  /**
   * Creates an action context for the current dispatch.
   * @returns A new action context
   */
  private createActionContext(): PreviewActionContext {
    // At this point, story availability has already been checked in dispatch()
    // for story-dependent actions, so story is guaranteed to be available when needed
    return {
      getState: () => ({ ...this.currentState }),
      setState: (newState: PreviewState) => {
        this.currentState = newState;
      },
      dispatch: (action: PreviewAction) => {
        this.applyAction(action);
      },
      story: this.story!, // Non-null assertion safe due to dispatch() guard
    };
  }

  /**
   * Applies an action directly without history tracking.
   * Used for nested dispatches.
   * @param action - The action to apply
   */
  private applyAction(action: PreviewAction): void {
    const context = this.createActionContext();
    action.apply(context);
  }

  /**
   * Adds an entry to the action history.
   * Maintains the maximum history size by removing old entries.
   * @param entry - The history entry to add
   */
  private addToHistory(entry: HistoryEntry): void {
    this.actionHistory.push(entry);

    // Maintain maximum history size
    if (this.actionHistory.length > this.maxHistorySize) {
      this.actionHistory.shift();
    }
  }

  /**
   * Creates the default state structure with optional overrides.
   * @param overrides - Partial state to override defaults
   * @returns Complete default state
   */
  private createDefaultState(overrides?: Partial<PreviewState>): PreviewState {
    const defaultState: PreviewState = {
      storyEvents: [],
      currentChoices: [],
      errors: [],
      isEnded: false,
      isStart: false,
      lastChoiceIndex: 0,
    };

    if (overrides) {
      return {
        ...defaultState,
        ...overrides,
      };
    }

    return defaultState;
  }
}
