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

import { PreviewActionContext } from "../PreviewActionContext";
import { AddErrorsAction } from "./AddErrorsAction";
import { PreviewState } from "../PreviewState";
import { StoryProgressAction } from "./StoryProgressAction";

const messageChoiceNoLongerAvailable =
  "The choice that was originally selected, is no longer available after live refreshing the story.  The story has rewound to where the choice was originally selected.";

/**
 * Action to select a Choice in the Story, continue the Story, triggering updates to the Story State.
 */
export class SelectChoiceAction extends StoryProgressAction {
  // Static Properties ================================================================================================

  public static readonly actionType = "SELECT_CHOICE";

  // Public Properties ==============================================================================================

  /**
   * @inheritdoc
   */
  public readonly cursor = true;

  /**
   * @inheritdoc
   */
  public readonly type = SelectChoiceAction.actionType;

  // Private Properties ===============================================================================================

  /**
   * The index of the Choice to select in the Story.
   */
  private readonly choiceIndex: number;

  // Constructor ======================================================================================================

  constructor(choiceIndex: number) {
    super();
    this.choiceIndex = choiceIndex;
  }

  // Public Methods ===================================================================================================

  /**
   * @inheritdoc
   */
  public apply(state: PreviewState): PreviewState {
    state.story.isStart = false;
    state.ui.canRewind = true;
    return state;
  }

  /**
   * @inheritdoc
   */
  public effect(context: PreviewActionContext): void {
    const storyManager = context.storyManager;
    const choiceCount = storyManager.getCurrentChoices().length;
    if (this.choiceIndex >= choiceCount) {
      context.dispatch(
        new AddErrorsAction([
          {
            message: messageChoiceNoLongerAvailable,
            severity: "info",
          },
        ])
      );
      return;
    }
    const result = storyManager.selectChoice(this.choiceIndex);
    this.applyStoryProgress(result, context);
  }
}
