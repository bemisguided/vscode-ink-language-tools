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

import { PreviewAction } from "../PreviewAction";
import { PreviewState } from "../PreviewState";
import { Choice } from "../types";

/**
 * Action to set the current choices available to the player.
 * Replaces all current choices with the provided choices array.
 */
export class SetCurrentChoicesAction implements PreviewAction {
  private readonly choices: Choice[];

  constructor(choices: Choice[]) {
    this.choices = choices;
  }

  /**
   * Reduces the current state by replacing the current choices.
   * All other state properties remain unchanged.
   *
   * @param state - The current preview state
   * @returns New state with updated currentChoices
   */
  reduce(state: PreviewState): PreviewState {
    return {
      ...state,
      currentChoices: this.choices,
    };
  }
}
