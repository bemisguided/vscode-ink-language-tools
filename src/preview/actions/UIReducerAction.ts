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

import { UIAction } from "./UIAction";
import { UIState } from "../UIState";
import { PreviewState } from "../PreviewState";
import { PreviewActionContext } from "../PreviewActionContext";

/**
 * Abstract base class for UI actions that primarily perform state mutations.
 * This provides a clean pattern for reducer-style actions that operate on UI state.
 *
 * Actions that extend this class should implement the reduce() method,
 * which will be called automatically from apply().
 */
export abstract class UIReducerAction implements UIAction {
  /**
   * The category identifier for this action.
   */
  public readonly category = "ui" as const;

  /**
   * @inheritdoc
   */
  public readonly historical = true;

  /**
   * The type identifier for this action.
   * Must be implemented by concrete action classes.
   */
  abstract readonly type: string;

  /**
   * Applies this action to the current UI state and returns a new UI state.
   *
   * This method must be pure:
   * - No side effects (no I/O, no mutations of input parameters)
   * - Always returns a new state object (never mutates the input state)
   * - Same input always produces the same output
   * - Should use object spread syntax to create new state: `{ ...state, ... }`
   *
   * @param state - The current UI state (must not be mutated)
   * @returns A new UI state with this action applied
   */
  abstract reduce(state: UIState): UIState;

  /**
   * @inheritdoc
   */
  public apply(state: PreviewState): PreviewState {
    const newUIState = this.reduce(state.ui);
    return {
      ...state,
      ui: newUIState,
    };
  }

  /**
   * @inheritdoc
   */
  public effect(context: PreviewActionContext): void {
    // no-op by default - subclasses can override if needed
  }
}
