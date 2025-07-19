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
import { SetCurrentChoicesAction } from "./SetCurrentChoicesAction";
import { EndStoryAction } from "./EndStoryAction";
import { AddErrorsAction } from "./AddErrorsAction";

/**
 * Action to continue the story until it reaches a choice point or ends.
 * This action handles the main story progression loop, collecting events,
 * extracting choices, and dispatching appropriate state mutations.
 */
export class ContinueStoryAction implements StoryAction {
  // Static Properties ================================================================================================

  /**
   * The type identifier for this action.
   * Used for action identification, filtering, and debugging.
   */
  public static readonly typeId = "CONTINUE_STORY";

  // Public Properties ==============================================================================================

  /**
   * The type identifier for this action instance.
   */
  public readonly type = ContinueStoryAction.typeId;

  // Public Methods ===================================================================================================

  /**
   * Applies this action to continue the story until it reaches a choice point or ends.
   * Uses the story manager to perform the continuation and dispatches appropriate state mutations.
   *
   * @param context - The action context providing state access and dispatch capability
   */
  apply(context: StoryActionContext): void {
    console.debug("[ContinueStoryAction] ⏭️ Continuing story");

    // Use story manager to continue the story
    const result = context.storyManager.continue();

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
      `[ContinueStoryAction] ✅ Continue completed: ${result.events.length} events, ${result.choices.length} choices, ${result.errors.length} errors, ended: ${result.isEnded}`
    );
  }
}
