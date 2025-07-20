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

import { UIState } from "./UIState";
import { StoryState } from "./StoryState";
import { PreviewAction } from "./PreviewAction";

/**
 * Context interface for UI domain actions.
 * Provides access to UI state and coordination capabilities.
 * UI actions often serve as the coordination layer between domains.
 */
export interface UIActionContext {
  /**
   * Gets the current UI state.
   * @returns Copy of current UI state
   */
  getState(): UIState;

  /**
   * Gets the current story state.
   * Used by UI actions to make decisions based on story state for coordination.
   * @returns Copy of current story state
   */
  getStoryState(): StoryState;

  /**
   * Updates the UI state.
   * @param state - New UI state to set
   */
  setState(state: UIState): void;

  /**
   * Dispatches an action back through the unified dispatcher.
   * Allows UI actions to trigger story actions or other UI actions.
   * @param action - Action to dispatch
   */
  dispatch(action: PreviewAction): void;

  /**
   * Rewinds the story back to before the last choice selection.
   * This goes back to the state before the last SelectChoiceAction was applied.
   * If no SelectChoiceAction exists in the story history, rewinds to the beginning.
   */
  rewindStoryToLastChoice(): void;

  /**
   * Sends the current story state to the webview.
   * UI actions often coordinate story updates and need to trigger story state communication.
   */
  sendStoryState(): void;

  /**
   * Sends the current UI state to the webview.
   * Used to notify the UI when UI state has changed.
   */
  sendUIState(): void;
}
