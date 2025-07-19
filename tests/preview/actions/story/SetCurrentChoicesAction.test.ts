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

import { SetCurrentChoicesAction } from "../../../../src/preview/actions/story/SetCurrentChoicesAction";
import { StoryState, Choice } from "../../../../src/preview/StoryState";
import { mockStoryState } from "../../../__mocks__/mockStoryState";

describe("SetCurrentChoicesAction", () => {
  describe("reduce", () => {
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
      const currentState: StoryState = mockStoryState({
        currentChoices: [],
        storyEvents: [],
      });

      // Execute
      const newState = action.reduce(currentState);

      // Assert
      expect(newState.currentChoices).toEqual(newChoices);
      expect(newState.lastChoiceIndex).toBe(0); // storyEvents.length
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
      const currentState: StoryState = mockStoryState({
        currentChoices: existingChoices,
        storyEvents: [
          {
            type: "text" as const,
            text: "Some story",
            tags: [],
          },
        ],
      });

      // Execute
      const newState = action.reduce(currentState);

      // Assert
      expect(newState.currentChoices).toEqual(newChoices);
      expect(newState.lastChoiceIndex).toBe(1); // storyEvents.length
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
      const currentState: StoryState = mockStoryState({
        storyEvents: [
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
      });

      // Execute
      const newState = action.reduce(currentState);

      // Assert
      expect(newState.lastChoiceIndex).toBe(3); // storyEvents.length
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
      const currentState: StoryState = mockStoryState({
        storyEvents: [
          {
            type: "text" as const,
            text: "Story content",
            tags: ["story"],
          },
        ],
        currentChoices: [],
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
      const newState = action.reduce(currentState);

      // Assert
      expect(newState.storyEvents).toEqual(currentState.storyEvents);
      expect(newState.errors).toEqual(currentState.errors);
      expect(newState.isEnded).toBe(true);
      expect(newState.isStart).toBe(false);
    });

    test("should handle empty choices array", () => {
      // Set up
      const action = new SetCurrentChoicesAction([]);
      const currentState: StoryState = mockStoryState({
        currentChoices: [
          {
            index: 0,
            text: "Existing choice",
            tags: [],
          },
        ],
        storyEvents: [
          {
            type: "text" as const,
            text: "Story event",
            tags: [],
          },
        ],
      });

      // Execute
      const newState = action.reduce(currentState);

      // Assert
      expect(newState.currentChoices).toEqual([]);
      expect(newState.lastChoiceIndex).toBe(1); // storyEvents.length
    });

    test("should return a new state object", () => {
      // Set up
      const newChoices: Choice[] = [
        {
          index: 0,
          text: "Test choice",
          tags: [],
        },
      ];
      const action = new SetCurrentChoicesAction(newChoices);
      const currentState: StoryState = mockStoryState();

      // Execute
      const newState = action.reduce(currentState);

      // Assert
      expect(newState).not.toBe(currentState);
      expect(newState).toEqual(
        mockStoryState({
          currentChoices: newChoices,
          lastChoiceIndex: 0,
        })
      );
    });
  });

  describe("Edge cases", () => {
    test("should handle choices with empty text", () => {
      // Set up
      const choicesWithEmptyText: Choice[] = [
        {
          index: 0,
          text: "",
          tags: [],
        },
        {
          index: 1,
          text: "Normal choice",
          tags: [],
        },
      ];
      const action = new SetCurrentChoicesAction(choicesWithEmptyText);
      const currentState: StoryState = mockStoryState();

      // Execute
      const newState = action.reduce(currentState);

      // Assert
      expect(newState.currentChoices).toEqual(choicesWithEmptyText);
    });

    test("should handle choices with special characters", () => {
      // Set up
      const specialChoices: Choice[] = [
        {
          index: 0,
          text: "Choice with special chars: àáâãäåæçèéêë 🔥💥",
          tags: ["special", "unicode"],
        },
      ];
      const action = new SetCurrentChoicesAction(specialChoices);
      const currentState: StoryState = mockStoryState();

      // Execute
      const newState = action.reduce(currentState);

      // Assert
      expect(newState.currentChoices).toEqual(specialChoices);
    });

    test("should handle choices with many tags", () => {
      // Set up
      const choicesWithManyTags: Choice[] = [
        {
          index: 0,
          text: "Choice with many tags",
          tags: ["tag1", "tag2", "tag3", "tag4", "tag5"],
        },
      ];
      const action = new SetCurrentChoicesAction(choicesWithManyTags);
      const currentState: StoryState = mockStoryState();

      // Execute
      const newState = action.reduce(currentState);

      // Assert
      expect(newState.currentChoices).toEqual(choicesWithManyTags);
    });

    test("should handle choices with duplicate indices", () => {
      // Set up
      const duplicateIndexChoices: Choice[] = [
        {
          index: 0,
          text: "First choice",
          tags: [],
        },
        {
          index: 0,
          text: "Second choice with same index",
          tags: [],
        },
      ];
      const action = new SetCurrentChoicesAction(duplicateIndexChoices);
      const currentState: StoryState = mockStoryState();

      // Execute
      const newState = action.reduce(currentState);

      // Assert
      expect(newState.currentChoices).toEqual(duplicateIndexChoices);
    });
  });
});
