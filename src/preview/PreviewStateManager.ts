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

import { freeze, produce } from "immer";
import { PreviewState } from "./PreviewState";
import { PreviewAction } from "./PreviewAction";
import { PreviewStoryManager } from "./PreviewStoryManager";
import { PreviewActionContext } from "./PreviewActionContext";
import { AddErrorsAction } from "./actions/AddErrorsAction";

/**
 * Represents a callback function for state changes.
 */
export type StateChangeCallback = (state: PreviewState) => void;

/**
 * Manages the complete state of the preview system using immutable state updates.
 * Processes actions through the apply() method pattern and maintains the single source of truth
 * for all preview data using the Full State Replacement Pattern.
 *
 * Also provides history tracking and replay functionality for undo/redo operations.
 */
export class PreviewStateManager {
  // Private Properties ===============================================================================================

  private cancelDispatch: boolean = false;

  private dispatchCount: number = 0;

  private history: PreviewAction[] = [];

  private state: PreviewState;

  private onStateChange?: StateChangeCallback;

  private storyManager!: PreviewStoryManager;

  // Constructor ======================================================================================================

  constructor() {
    this.state = this.createDefaultState();
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
    // Count the number of dispatch calls
    this.dispatchCount++;

    // Reduce the state
    const stateAfter = produce(this.state, (draft) => {
      action.apply(draft);
    });
    this.state = stateAfter;

    // Add to history if the action is historical
    if (action.cursor) {
      this.history.push(action);
    }

    // Perform side effects
    action.effect(this.createContext());

    // Send state change notification, when all actions have been processed
    this.dispatchCount--;
    if (this.dispatchCount <= 0) {
      this.sendState();
    }

    // Return the new state
    return this.getState();
  }

  /**
   * Gets the complete current state.
   * @returns A copy of the current state with dual structure
   */
  public getState(): PreviewState {
    return this.state;
  }

  /**
   * Gets the story history.
   * @returns A copy of the story history
   */
  public getHistory(): PreviewAction[] {
    return [...this.history];
  }

  /**
   * Gets the story manager.
   * @returns The story manager
   */
  public getStoryManager(): PreviewStoryManager {
    return this.storyManager;
  }

  /**
   * Sets the story manager.
   * @param storyManager - The story manager
   */
  public setStoryManager(storyManager: PreviewStoryManager): void {
    this.storyManager = storyManager;
    this.registerErrorHandler();
  }

  /**
   * Replays the history up to a specific point.
   * This is useful for undo operations.
   *
   * @param toIndex - The index to replay to (exclusive). If not provided, replays all history
   * @returns The state after replay
   */
  public replay(toIndex?: number): PreviewState {
    // Get the end index
    const endIndex = toIndex ?? this.history.length;

    // Validate the index
    if (endIndex < 0 || endIndex > this.history.length) {
      throw new Error(`Invalid replay index: ${endIndex}`);
    }

    // Reset cancel flag
    this.disableCancel();

    // Clone the history
    const history = [...this.history.slice(0, endIndex)];

    // Clear the history
    this.history = [];

    // Replay actions up to the target index
    for (let i = 0; i < endIndex; i++) {
      const action = history[i];
      if (this.cancelDispatch) {
        this.disableCancel();
        break;
      }
      this.dispatch(action);
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
      if (this.history[i].type === actionType) {
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
    this.state = this.createDefaultState();
    this.history = [];
  }

  /**
   * Sets the callback function for state changes.
   * @param callback - Function to call when state changes (no parameters)
   */
  public setOnStateChange(callback: StateChangeCallback): void {
    this.onStateChange = callback;
  }

  /**
   * Sends the current state to registered listeners.
   * Triggers the state change callback if set (simple notification).
   */
  public sendState(): void {
    if (this.onStateChange) {
      this.onStateChange(this.getState());
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

  private createContext(): PreviewActionContext {
    return {
      getState: () => this.getState(),
      cancel: () => {
        this.enableCancel();
      },
      dispatch: (action: PreviewAction) => {
        this.dispatch(action);
      },
      storyManager: this.storyManager,
      undo: () => this.undo(),
    };
  }

  private createDefaultState(): PreviewState {
    const state: PreviewState = {
      story: this.createDefaultStoryState(),
      ui: {
        canRewind: false,
        liveUpdateEnabled: true,
      },
    };

    return freeze(state, true);
  }

  private createDefaultStoryState(): PreviewState["story"] {
    return {
      events: [],
      choices: [],
      errors: [],
      isEnded: false,
      isStart: true,
      lastChoiceIndex: 0,
    };
  }

  private enableCancel(): void {
    this.cancelDispatch = true;
  }

  private disableCancel(): void {
    this.cancelDispatch = false;
  }

  private registerErrorHandler(): void {
    this.storyManager.onError((error) => {
      this.dispatch(new AddErrorsAction([error]));
    });
  }
}
