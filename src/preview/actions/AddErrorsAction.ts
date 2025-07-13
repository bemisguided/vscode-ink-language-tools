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
import { ErrorInfo } from "../PreviewState";

/**
 * Action to add errors to the state.
 * Appends a list of new errors to the existing errors array.
 * This allows for flexible addition of single errors or multiple errors at once.
 */
export class AddErrorsAction extends PreviewReducerAction {
  private readonly errors: ErrorInfo[];

  constructor(errors: ErrorInfo[]) {
    super();
    this.errors = errors;
  }

  /**
   * Reduces the current state by appending new errors.
   * Maintains all existing errors and adds the new ones.
   *
   * @param state - The current preview state
   * @returns New state with additional errors appended
   */
  reduce(state: PreviewState): PreviewState {
    return {
      ...state,
      errors: [...state.errors, ...this.errors],
    };
  }
}
