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

import { StoryState } from "./StoryState";
import { PreviewAction } from "./PreviewAction";
import { PreviewStoryManager } from "./PreviewStoryManager";

/**
 * Context interface for story domain actions.
 * Provides access to story state and story management operations.
 * Actions operating on story data use this context exclusively.
 */
export interface StoryActionContext {
  /**
   * Gets the current story state.
   * @returns Copy of current story state
   */
  getState(): StoryState;

  /**
   * Updates the story state.
   * @param state - New story state to set
   */
  setState(state: StoryState): void;

  /**
   * Dispatches an action back through the unified dispatcher.
   * Allows story actions to trigger other actions when needed.
   * @param action - Action to dispatch
   */
  dispatch(action: PreviewAction): void;

  /**
   * Story manager for interacting with the Ink story engine.
   * Provides methods for continuing story, selecting choices, etc.
   */
  storyManager: PreviewStoryManager;

  /**
   * Sends the current story state to the webview.
   * Used to notify the UI when story state has changed.
   */
  sendStoryState(): void;
}
