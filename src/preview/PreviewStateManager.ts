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

import { PreviewState } from "./PreviewState";
import { PreviewAction } from "./PreviewAction";

/**
 * Manages the complete state of the preview system using immutable state updates.
 * Processes actions through the self-reducing pattern and maintains the single source of truth
 * for all preview data using the Full State Replacement Pattern.
 */
export class PreviewStateManager {
  // Private Properties ===============================================================================================

  private currentState: PreviewState;

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
   * Dispatches an action to update the state.
   * Uses the action's reduce() method to generate the new state immutably.
   * @param action - The action to dispatch
   * @returns The new state after applying the action
   */
  public dispatch(action: PreviewAction): PreviewState {
    const newState = action.reduce(this.currentState);
    this.currentState = newState;
    return newState;
  }

  /**
   * Gets the current state.
   * @returns A copy of the current state
   */
  public getState(): PreviewState {
    return { ...this.currentState };
  }

  /**
   * Resets the state to the initial default state.
   * Preserves metadata if it was set during construction.
   */
  public reset(): void {
    const preservedMetadata = this.currentState.metadata;
    this.currentState = this.createDefaultState({
      metadata: preservedMetadata,
    });
  }

  /**
   * Disposes of the state manager and cleans up resources.
   */
  public dispose(): void {
    // Clear state for garbage collection
    this.currentState = this.createDefaultState();
  }

  // Private Methods ==================================================================================================

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
      metadata: {
        title: "Untitled Story",
        fileName: "unknown.ink",
      },
    };

    if (overrides) {
      return {
        ...defaultState,
        ...overrides,
        // Ensure metadata is properly merged
        metadata: {
          ...defaultState.metadata,
          ...overrides.metadata,
        },
      };
    }

    return defaultState;
  }
}
