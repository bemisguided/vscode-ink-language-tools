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

import { StoryAction } from "../../StoryAction";
import { StoryActionContext } from "../../StoryActionContext";
import { AddStoryEventsAction } from "./AddStoryEventsAction";
import { EndStoryAction } from "./EndStoryAction";
import { SetCurrentChoicesAction } from "./SetCurrentChoicesAction";
import { AddErrorsAction } from "./AddErrorsAction";

/**
 * Action to select a choice in the story and then continue until the next choice point or end.
 * This action uses composition to reuse the continue logic after choice selection.
 */
export class SelectChoiceAction implements StoryAction {
  // Static Properties ================================================================================================

  /**
   * The type identifier for this action.
   * Used for action identification, filtering, and debugging.
   */
  public static readonly typeId = "SELECT_CHOICE";

  // Public Properties ==============================================================================================

  /**
   * The category identifier for this action.
   */
  public readonly category = "story" as const;

  /**
   * The type identifier for this action instance.
   */
  public readonly type = SelectChoiceAction.typeId;

  /**
   * The index of the choice to select.
   */
  private readonly choiceIndex: number;

  // Constructor ======================================================================================================

  /**
   * Creates a new SelectChoiceAction.
   * @param choiceIndex - The index of the choice to select
   */
  constructor(choiceIndex: number) {
    this.choiceIndex = choiceIndex;
  }

  // Public Methods ===================================================================================================

  /**
   * Applies this action to select a choice and continue the story.
   * Uses the story manager to select the choice and continue in one operation.
   *
   * @param context - The action context providing state access and dispatch capability
   */
  apply(context: StoryActionContext): void {
    console.debug(
      `[SelectChoiceAction] 🎯 Selecting choice ${this.choiceIndex}`
    );

    // Use story manager to select choice and continue the story
    const result = context.storyManager.selectChoice(this.choiceIndex);

    // Dispatch error actions if errors occurred
    if (result.errors.length > 0) {
      context.dispatch(new AddErrorsAction(result.errors));
    }

    // Dispatch state mutations based on the result
    if (result.events.length > 0) {
      context.dispatch(new AddStoryEventsAction(result.events));
    }

    context.dispatch(new SetCurrentChoicesAction(result.choices));

    if (result.isEnded) {
      context.dispatch(new EndStoryAction());
    }

    console.debug(
      `[SelectChoiceAction] ✅ Choice selection completed: ${result.events.length} events, ${result.choices.length} choices, ended: ${result.isEnded}`
    );
  }
}
