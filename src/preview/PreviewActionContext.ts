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

import { PreviewAction } from "./PreviewAction";
import { PreviewState } from "./PreviewState";
import { PreviewStoryManager } from "./PreviewStoryManager";

/**
 * Context object passed to all PreviewAction.apply() methods.
 * Provides access to current state, state mutation, action dispatching, and side-effect resources.
 */
export interface PreviewActionContext {
  /**
   * Gets the current preview state.
   * @returns The current preview state (immutable)
   */
  getState(): PreviewState;

  /**
   * Dispatches another action within this action's context.
   * This allows actions to dispatch other actions.
   * @param action - The action to dispatch
   */
  dispatch(action: PreviewAction): void;

  /**
   * The story manager for performing story operations.
   * This provides a high-level interface for story interactions (reset, continue, selectChoice).
   * Guaranteed to be available for story-dependent actions.
   */
  storyManager: PreviewStoryManager;

  /**
   * Sends the current story state to the webview.
   * Available for actions that need to trigger state updates to the UI.
   */
  sendStoryState(): void;

  /**
   * Undoes the last action.
   */
  undo(): void;

  /**
   * Undoes the last action of a specific type.
   */
  undoToLast(actionType: string): void;
}
