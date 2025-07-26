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
import { Choice, PreviewState } from "../PreviewState";
import { PreviewActionContext } from "../PreviewActionContext";

/**
 * Action to set the current choices available in the story.
 * Replaces the existing currentChoices array with the provided choices.
 */
export class SetCurrentChoicesAction implements PreviewAction {
  // Static Properties ================================================================================================

  /**
   * The type identifier for this action.
   * Used for action identification, filtering, and debugging.
   */
  public static readonly actionType = "SET_CURRENT_CHOICES";

  // Public Properties ==============================================================================================

  /**
   * @inheritdoc
   */
  public readonly cursor = false;

  /**
   * The type identifier for this action instance.
   */
  public readonly type = SetCurrentChoicesAction.actionType;

  // Private Properties ===============================================================================================

  /**
   * The list of choices to set as current choices.
   */
  private readonly choices: Choice[];

  // Constructor ======================================================================================================

  /**
   * Creates a new SetCurrentChoicesAction.
   * @param choices - The list of choices to set as current choices
   */
  constructor(choices: Choice[]) {
    this.choices = choices;
  }

  // Public Methods ===================================================================================================

  /**
   * @inheritdoc
   */
  public apply(state: PreviewState): PreviewState {
    state.story.choices = [...this.choices];
    state.story.lastChoiceIndex = state.story.events.length;
    return state;
  }

  /**
   * @inheritdoc
   */
  public effect(context: PreviewActionContext): void {
    // no-op
  }
}
