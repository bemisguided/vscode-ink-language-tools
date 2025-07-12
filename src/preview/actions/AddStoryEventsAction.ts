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
import { StoryEvent } from "../types";

/**
 * Action to add story events to the state.
 * Appends a list of new story events to the existing storyEvents array.
 * This allows for flexible addition of single events or multiple events at once.
 */
export class AddStoryEventsAction implements PreviewAction {
  private readonly events: StoryEvent[];

  constructor(events: StoryEvent[]) {
    this.events = events;
  }

  /**
   * Reduces the current state by appending new story events.
   * All other state properties remain unchanged.
   *
   * @param state - The current preview state
   * @returns New state with the new events appended to storyEvents
   */
  reduce(state: PreviewState): PreviewState {
    return {
      ...state,
      storyEvents: [...state.storyEvents, ...this.events],
    };
  }
}
