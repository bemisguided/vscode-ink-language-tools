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

/**
 * Base interface for all preview state actions.
 *
 * This interface implements the Command pattern where each action encapsulates
 * both the data it operates on and the logic for how it transforms the state.
 * Actions are the only way to modify the preview state, ensuring predictable
 * and testable state mutations.
 *
 * All implementations must be pure functions with no side effects.
 */
export interface PreviewAction {
  /**
   * Applies this action to the current state and returns a new state.
   *
   * This method must be pure:
   * - No side effects (no I/O, no mutations of input parameters)
   * - Always returns a new state object (never mutates the input state)
   * - Same input always produces the same output
   * - Should use object spread syntax to create new state: `{ ...state, ... }`
   *
   * @param state - The current preview state (must not be mutated)
   * @returns A new preview state with this action applied
   */
  reduce(state: PreviewState): PreviewState;
}
