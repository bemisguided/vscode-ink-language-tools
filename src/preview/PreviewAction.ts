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

import { PreviewActionContext } from "./PreviewActionContext";
import { PreviewState } from "./PreviewState";

/**
 * Interface representing a Preview Action.
 */
export interface PreviewAction {
  /**
   * The type identifier for this Action.
   */
  readonly type: string;

  /**
   * Indicates whether this Action is tracked in the history.
   */
  readonly cursor: boolean;

  /**
   * Applies this Action to the Preview State.
   * @param state - The Preview State upon which to apply this Action
   * @returns The resulting updated Preview State
   */
  apply(state: PreviewState): PreviewState;

  /**
   * Applies this Action as a side-effect to the Story.
   * @param context - The Preview Action Context
   */
  effect(context: PreviewActionContext): void;
}
