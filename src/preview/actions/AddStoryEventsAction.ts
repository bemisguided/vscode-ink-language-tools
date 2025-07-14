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
import { StoryEvent } from "../types";

/**
 * Action to add story events to the state.
 * Appends a list of new story events to the existing storyEvents array.
 * This allows for flexible addition of single events or multiple events at once.
 */
export class AddStoryEventsAction extends PreviewReducerAction {
  // Static Properties ================================================================================================

  /**
   * The type identifier for this action.
   * Used for action identification, filtering, and debugging.
   */
  public static readonly typeId = "ADD_STORY_EVENTS";

  // Instance Properties ==============================================================================================

  /**
   * The type identifier for this action instance.
   */
  public readonly type = AddStoryEventsAction.typeId;

  /**
   * The list of story events to add to the state.
   */
  private readonly events: StoryEvent[];

  // Constructor ======================================================================================================

  /**
   * Creates a new AddStoryEventsAction.
   * @param events - The list of story events to add to the state
   */
  constructor(events: StoryEvent[]) {
    super();
    this.events = events;
  }

  // Public Methods ===================================================================================================

  /**
   * Reduces the current state by appending new story events.
   * Uses lastChoiceIndex to determine which events should be marked as current.
   * Events with index >= lastChoiceIndex are marked as current (from the current turn).
   * Events with index < lastChoiceIndex are marked as historical (from previous turns).
   *
   * @param state - The current preview state
   * @returns New state with events appended and isCurrent flags set based on lastChoiceIndex
   */
  reduce(state: PreviewState): PreviewState {
    // Combine existing events with new events
    const allEvents = [...state.storyEvents, ...this.events];

    // Set isCurrent based on lastChoiceIndex
    const eventsWithCurrentFlags = allEvents.map((event, index) => ({
      ...event,
      isCurrent: index >= state.lastChoiceIndex,
    }));

    return {
      ...state,
      storyEvents: eventsWithCurrentFlags,
    };
  }
}
