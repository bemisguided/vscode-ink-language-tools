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

import { PreviewReducerAction } from "../PreviewAction";
import { PreviewState } from "../PreviewState";

/**
 * Action to clear all errors from the state.
 * Removes all errors from the errors array.
 */
export class ClearErrorsAction extends PreviewReducerAction {
  // Static Properties ================================================================================================

  /**
   * The type identifier for this action.
   * Used for action identification, filtering, and debugging.
   */
  public static readonly typeId = "CLEAR_ERRORS";

  // Instance Properties ==============================================================================================

  /**
   * The type identifier for this action instance.
   */
  public readonly type = ClearErrorsAction.typeId;

  // Public Methods ===================================================================================================

  /**
   * Reduces the current state by clearing all errors.
   * This removes all accumulated errors from the state, effectively resetting
   * the error list to an empty array.
   *
   * @param state - The current preview state
   * @returns New state with cleared errors array
   */
  reduce(state: PreviewState): PreviewState {
    return {
      ...state,
      errors: [],
      uiState: { ...state.uiState },
    };
  }
}
