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

import { SetCurrentChoicesAction } from "../../../src/preview/actions/SetCurrentChoicesAction";
import {
  Choice,
  PreviewState,
  PreviewStoryState,
} from "../../../src/preview/PreviewState";
import {
  mockPreviewState,
  mockPreviewStoryState,
} from "../../__mocks__/mockPreviewState";

describe("SetCurrentChoicesAction", () => {
  function setupState(
    story: PreviewStoryState = mockPreviewStoryState()
  ): PreviewState {
    return mockPreviewState(story);
  }
  describe("apply()", () => {
    test("should set choices when currentChoices is empty", () => {
      // Set up
      const newChoices: Choice[] = [
        {
          index: 0,
          text: "Go north",
          tags: ["direction"],
        },
        {
          index: 1,
          text: "Go south",
          tags: ["direction"],
        },
      ];
      const action = new SetCurrentChoicesAction(newChoices);
      const currentState: PreviewState = setupState();

      // Execute
      const newState = action.apply(currentState);

      // Assert
      expect(newState.story.choices).toEqual(newChoices);
      expect(newState.story.lastChoiceIndex).toBe(0); // storyEvents.length
    });

    test("should replace existing choices", () => {
      // Set up
      const existingChoices: Choice[] = [
        {
          index: 0,
          text: "Old choice",
          tags: ["old"],
        },
      ];
      const newChoices: Choice[] = [
        {
          index: 0,
          text: "New choice 1",
          tags: ["new"],
        },
        {
          index: 1,
          text: "New choice 2",
          tags: ["new"],
        },
      ];
      const action = new SetCurrentChoicesAction(newChoices);
      const currentState: PreviewState = setupState({
        choices: existingChoices,
        events: [
          {
            type: "text" as const,
            text: "Some story",
            tags: [],
          },
        ],
        lastChoiceIndex: 0,
        errors: [],
        isEnded: false,
        isStart: false,
      });

      // Execute
      const newState = action.apply(currentState);

      // Assert
      expect(newState.story.choices).toEqual(newChoices);
      expect(newState.story.lastChoiceIndex).toBe(1); // storyEvents.length
    });

    test("should update lastChoiceIndex to storyEvents length", () => {
      // Set up
      const newChoices: Choice[] = [
        {
          index: 0,
          text: "Choice",
          tags: [],
        },
      ];
      const action = new SetCurrentChoicesAction(newChoices);
      const currentState: PreviewState = setupState({
        choices: [],
        events: [
          {
            type: "text" as const,
            text: "Event 1",
            tags: [],
          },
          {
            type: "text" as const,
            text: "Event 2",
            tags: [],
          },
          {
            type: "function" as const,
            functionName: "testFunc",
            args: [],
            result: "result",
          },
        ],
        lastChoiceIndex: 99, // Should be overwritten
        errors: [],
        isEnded: false,
        isStart: false,
      });

      // Execute
      const newState = action.apply(currentState);

      // Assert
      expect(newState.story.lastChoiceIndex).toBe(3); // storyEvents.length
    });

    test("should preserve all other state properties", () => {
      // Set up
      const newChoices: Choice[] = [
        {
          index: 0,
          text: "Test choice",
          tags: ["test"],
        },
      ];
      const action = new SetCurrentChoicesAction(newChoices);
      const currentState: PreviewState = setupState({
        events: [
          {
            type: "text" as const,
            text: "Story content",
            tags: ["story"],
          },
        ],
        choices: [],
        errors: [
          {
            message: "Test error",
            severity: "error",
          },
        ],
        isEnded: true,
        isStart: false,
        lastChoiceIndex: 0,
      });

      // Execute
      const newState = action.apply(currentState);

      // Assert
      expect(newState.story.events).toEqual(currentState.story.events);
      expect(newState.story.errors).toEqual(currentState.story.errors);
      expect(newState.story.isEnded).toBe(true);
      expect(newState.story.isStart).toBe(false);
    });

    test("should handle empty choices array", () => {
      // Set up
      const action = new SetCurrentChoicesAction([]);
      const currentState: PreviewState = setupState({
        choices: [
          {
            index: 0,
            text: "Existing choice",
            tags: [],
          },
        ],
        events: [
          {
            type: "text" as const,
            text: "Story event",
            tags: [],
          },
        ],
        lastChoiceIndex: 0,
        errors: [],
        isEnded: false,
        isStart: false,
      });

      // Execute
      const newState = action.apply(currentState);

      // Assert
      expect(newState.story.choices).toEqual([]);
      expect(newState.story.lastChoiceIndex).toBe(1); // storyEvents.length
    });

    test("should return a new state object", () => {
      // Set up
      const newChoice: Choice = {
        index: 0,
        text: "Test choice",
        tags: [],
      };
      const action = new SetCurrentChoicesAction([newChoice]);
      const currentState: PreviewState = setupState();

      // Execute
      const newState = action.apply(currentState);

      // Assert
      expect(newState.story.choices).toEqual([newChoice]);
    });
  });
});
