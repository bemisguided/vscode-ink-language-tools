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
import { PreviewState, StoryEvent } from "../PreviewState";
import { PreviewActionContext } from "../PreviewActionContext";

/**
 * Action to add story events to the Story State.
 */
export class AddStoryEventsAction implements PreviewAction {
  // Static Properties ================================================================================================

  public static readonly actionType = "ADD_STORY_EVENTS";

  // Public Properties ==============================================================================================

  /**
   * @inheritdoc
   */
  public readonly cursor = false;

  /**
   * @inheritdoc
   */
  public readonly type = AddStoryEventsAction.actionType;

  // Private Properties ===============================================================================================

  /**
   * The list of Story Events to be added to the Story.
   */
  private readonly events: StoryEvent[];

  // Constructor ======================================================================================================

  constructor(events: StoryEvent[]) {
    this.events = events;
  }

  // Public Methods ===================================================================================================

  /**
   * @inheritdoc
   */
  public apply(state: PreviewState): PreviewState {
    state.story.events.push(...this.events);
    state.story.events.forEach((event, index) => {
      event.isCurrent = index >= state.story.lastChoiceIndex;
    });
    return state;
  }

  /**
   * @inheritdoc
   */
  public effect(context: PreviewActionContext): void {
    // no-op
  }
}
