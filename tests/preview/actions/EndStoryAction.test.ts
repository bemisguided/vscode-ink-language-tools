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

import { EndStoryAction } from "../../../src/preview/actions/EndStoryAction";
import { PreviewState } from "../../../src/preview/PreviewState";
import { StoryEvent, StoryState } from "../../../src/preview/StoryState";
import { mockStoryState } from "../../__mocks__/mockStoryState";
import { mockPreviewState } from "../../__mocks__/mockPreviewState";

describe("EndStoryAction", () => {
  function setupState(story: StoryState = mockStoryState()): PreviewState {
    return {
      ...mockPreviewState(),
      story,
    };
  }
  let action: EndStoryAction;

  beforeEach(() => {
    action = new EndStoryAction();
  });

  describe("apply", () => {
    test("should set isEnded to true", () => {
      // Setup
      const currentState: PreviewState = setupState({
        ...mockStoryState(),
        isEnded: false,
      });

      // Execute
      const newState = action.apply(currentState);

      // Assert
      expect(newState.story.isEnded).toBe(true);
    });

    test("should preserve all other state properties", () => {
      // Setup
      const existingEvent: StoryEvent = {
        type: "text",
        text: "Existing event",
        tags: [],
        isCurrent: false,
      };
      const currentState: PreviewState = setupState({
        storyEvents: [existingEvent],
        currentChoices: [
          {
            index: 0,
            text: "Final choice",
            tags: [],
          },
        ],
        errors: [
          {
            message: "Some error",
            severity: "error",
          },
        ],
        isEnded: false,
        isStart: true,
        lastChoiceIndex: 5,
      });

      // Execute
      const newState = action.apply(currentState);

      // Assert
      expect(newState.story.storyEvents).toEqual(
        currentState.story.storyEvents
      );
      expect(newState.story.currentChoices).toEqual(
        currentState.story.currentChoices
      );
      expect(newState.story.errors).toEqual(currentState.story.errors);
      expect(newState.story.isStart).toBe(false);
      expect(newState.story.lastChoiceIndex).toBe(5);
    });

    test("should return a new state object", () => {
      // Setup
      const currentState: PreviewState = setupState();

      // Execute
      const newState = action.apply(currentState);

      // Assert
      expect(newState).not.toBe(currentState);
      expect(newState).toEqual(
        setupState({
          ...mockStoryState(),
          isEnded: true,
          isStart: false,
        })
      );
    });

    test("should work when isEnded is already true", () => {
      // Setup
      const currentState: PreviewState = setupState({
        ...mockStoryState(),
        isEnded: true,
      });

      // Execute
      const newState = action.apply(currentState);

      // Assert
      expect(newState.story.isEnded).toBe(true);
    });
  });
});
