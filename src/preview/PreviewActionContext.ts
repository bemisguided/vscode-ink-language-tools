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
 * Preview Action Context used by Preview Actions to enact side-effects and access the Preview State.
 */
export interface PreviewActionContext {
  /**
   * Gets the current Preview State.
   * @returns The current Preview State (immutable)
   */
  getState(): PreviewState;

  /**
   * Cancels the current Preview Action, preventing any further dispatch Preview Actions to be applied.
   */
  cancel(): void;

  /**
   * Dispatches another Preview Action.
   * @param action - The Preview Action to dispatch
   */
  dispatch(action: PreviewAction): void;

  /**
   * The Preview Story Manager for performing Story operations.
   */
  storyManager: PreviewStoryManager;

  /**
   * Undoes the last Preview Action.
   */
  undo(): void;
}
