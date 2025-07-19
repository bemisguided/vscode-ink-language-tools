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

import { StoryReducerAction } from "../StoryReducerAction";
import { StoryState } from "../../StoryState";

/**
 * Action to end the story.
 * Marks the story as ended and no longer starting.
 */
export class EndStoryAction extends StoryReducerAction {
  // Static Properties ================================================================================================

  /**
   * The type identifier for this action.
   * Used for action identification, filtering, and debugging.
   */
  public static readonly typeId = "END_STORY";

  // Public Properties ==============================================================================================

  /**
   * The type identifier for this action instance.
   */
  public readonly type = EndStoryAction.typeId;

  // Public Methods ===================================================================================================

  /**
   * Reduces the current state by marking the story as ended.
   * This sets the isEnded flag to true, indicating that the story
   * has reached a conclusion and no further progression is possible.
   *
   * @param state - The current story state
   * @returns New state with isEnded flag set to true
   */
  reduce(state: StoryState): StoryState {
    return {
      ...state,
      isEnded: true,
      isStart: false,
    };
  }
}
