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
import { PreviewAction } from "./PreviewAction";
import { PreviewStoryManager } from "./PreviewStoryManager";
import { PreviewActionContext } from "./PreviewActionContext";

/**
 * Represents a single entry in the action history.
 * Generic to support both story and UI state tracking.
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

  private state!: PreviewState;
  private history: HistoryEntry[] = [];
  private storyManager: PreviewStoryManager;

  private onStateChange?: () => void;

  private static readonly storyDependentActions = new Set([
    "INITIALIZE_STORY",
    "CONTINUE_STORY",
    "SELECT_CHOICE",
  ]);

  // Constructor ======================================================================================================

  constructor(
    storyManager: PreviewStoryManager,
    initialState?: Partial<PreviewState>
  ) {
    this.storyManager = storyManager;
    this.state = this.createDefaultState(initialState);
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
    const stateBefore = this.state;
    const stateAfter = action.apply(stateBefore);
    this.state = stateAfter;
    this.history.push({
      action,
      timestamp: Date.now(),
      stateBefore,
      stateAfter,
    });
    action.effect(this.createContext());
    this.sendState();
    return this.getState();
  }

  /**
   * Gets the complete current state.
   * @returns A copy of the current state with dual structure
   */
  public getState(): PreviewState {
    return JSON.parse(JSON.stringify(this.state));
  }

  /**
   * Gets the story history.
   * @returns A copy of the story history
   */
  public getHistory(): HistoryEntry[] {
    return [...this.history];
  }

  /**
   * Replays the history up to a specific point.
   * This is useful for undo operations.
   *
   * @param toIndex - The index to replay to (exclusive). If not provided, replays all history
   * @returns The state after replay
   */
  public replay(toIndex?: number): PreviewState {
    const endIndex = toIndex ?? this.history.length;

    if (endIndex < 0 || endIndex > this.history.length) {
      throw new Error(`Invalid replay index: ${endIndex}`);
    }

    // Replay actions up to the target index
    for (let i = 0; i < endIndex; i++) {
      const entry = this.history[i];
      this.dispatch(entry.action);
    }

    return this.getState();
  }

  /**
   * Undoes the last action by replaying history without the last entry.
   * @returns The state after undo, or current state if no history
   */
  public undo(): PreviewState {
    if (this.history.length === 0) {
      return this.getState();
    }

    return this.replay(this.history.length - 1);
  }

  /**
   * Undoes story actions back to the last occurrence of a specific action type.
   * Replays story history up to (but not including) the last occurrence of the action type.
   * If no action of the specified type is found, replays to the beginning.
   *
   * @param actionType - The action type identifier to search for
   * @returns The state after undoing to the last occurrence of the action type
   */
  public undoToLast(actionType: string): PreviewState {
    // Find the last occurrence of the action type in history
    let lastIndex = -1;
    for (let i = this.history.length - 1; i >= 0; i--) {
      if (this.history[i].action.type === actionType) {
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
   * Resets the state to the initial default state.
   * Preserves metadata if it was set during construction.
   * Clears all histories.
   */
  public reset(): void {
    const defaultState = this.createDefaultState();
    this.state = defaultState;
    this.history = [];
  }

  /**
   * Sets the callback function for state changes.
   * @param callback - Function to call when state changes (no parameters)
   */
  public setOnStateChange(callback: () => void): void {
    this.onStateChange = callback;
  }

  /**
   * Sends the current state to registered listeners.
   * Triggers the state change callback if set (simple notification).
   */
  public sendState(): void {
    if (this.onStateChange) {
      this.onStateChange();
    }
  }

  /**
   * Disposes of the state manager and cleans up resources.
   */
  public dispose(): void {
    this.reset();
    this.history = [];
    this.onStateChange = undefined;
  }

  // Private Methods ==================================================================================================

  /**
   * Creates a story action context for story domain actions.
   * @returns StoryActionContext with story state access and operations
   */
  private createContext(): PreviewActionContext {
    return {
      getState: () => this.getState(),
      dispatch: (action: PreviewAction) => {
        this.dispatch(action);
      },
      storyManager: this.storyManager || ({} as any), // Provide a stub if not set
      sendStoryState: () => {
        this.sendState();
      },
      undo: () => this.undo(),
      undoToLast: (actionType: string) => this.undoToLast(actionType),
    };
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
        canRewind: false,
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
