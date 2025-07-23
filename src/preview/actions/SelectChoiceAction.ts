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
import { PreviewActionContext } from "../PreviewActionContext";
import { AddStoryEventsAction } from "./AddStoryEventsAction";
import { EndStoryAction } from "./EndStoryAction";
import { SetCurrentChoicesAction } from "./SetCurrentChoicesAction";
import { AddErrorsAction } from "./AddErrorsAction";
import { PreviewState } from "../PreviewState";

/**
 * Action to select a choice in the Story, continue the Story, and trigger updates to the Story State.
 */
export class SelectChoiceAction implements PreviewAction {
  // Static Properties ================================================================================================

  public static readonly actionType = "SELECT_CHOICE";

  // Public Properties ==============================================================================================

  /**
   * @inheritdoc
   */
  public readonly historical = true;

  /**
   * @inheritdoc
   */
  public readonly type = SelectChoiceAction.actionType;

  // Private Properties ===============================================================================================

  /**
   * The index of the choice to select in the Story State.
   */
  private readonly choiceIndex: number;

  // Constructor ======================================================================================================

  constructor(choiceIndex: number) {
    this.choiceIndex = choiceIndex;
  }

  // Public Methods ===================================================================================================

  /**
   * @inheritdoc
   */
  public apply(state: PreviewState): PreviewState {
    return state;
  }

  /**
   * @inheritdoc
   */
  public effect(context: PreviewActionContext): void {
    const storyManager = context.storyManager;
    const result = storyManager.selectChoice(this.choiceIndex);

    if (result.errors.length > 0) {
      context.dispatch(new AddErrorsAction(result.errors));
    }

    if (result.events.length > 0) {
      context.dispatch(new AddStoryEventsAction(result.events));
    }

    context.dispatch(new SetCurrentChoicesAction(result.choices));

    if (result.isEnded) {
      context.dispatch(new EndStoryAction());
    }
  }
}
