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

import { ClearErrorsAction } from "../../../../src/preview/actions/story/ClearErrorsAction";
import { StoryState } from "../../../../src/preview/StoryState";
import { mockStoryState } from "../../../__mocks__/mockStoryState";

describe("ClearErrorsAction", () => {
  let action: ClearErrorsAction;

  beforeEach(() => {
    action = new ClearErrorsAction();
  });

  describe("reduce", () => {
    test("should clear all errors", () => {
      // Set up
      const currentState: StoryState = mockStoryState({
        errors: [
          {
            message: "Error 1",
            severity: "error",
          },
          {
            message: "Warning 1",
            severity: "warning",
          },
          {
            message: "Info 1",
            severity: "info",
          },
        ],
      });

      // Execute
      const newState = action.reduce(currentState);

      // Assert
      expect(newState.errors).toEqual([]);
    });

    test("should preserve all other state properties", () => {
      // Set up
      const currentState: StoryState = mockStoryState({
        storyEvents: [
          {
            type: "text" as const,
            text: "Some story text",
            tags: ["test"],
          },
        ],
        currentChoices: [
          {
            index: 0,
            text: "Choice 1",
            tags: ["choice"],
          },
        ],
        errors: [
          {
            message: "Some error",
            severity: "error",
          },
        ],
        isEnded: true,
        isStart: false,
        lastChoiceIndex: 3,
      });

      // Execute
      const newState = action.reduce(currentState);

      // Assert
      expect(newState.storyEvents).toEqual(currentState.storyEvents);
      expect(newState.currentChoices).toEqual(currentState.currentChoices);
      expect(newState.isEnded).toBe(true);
      expect(newState.isStart).toBe(false);
      expect(newState.lastChoiceIndex).toBe(3);
    });

    test("should work when errors array is already empty", () => {
      // Set up
      const currentState: StoryState = mockStoryState({
        errors: [],
      });

      // Execute
      const newState = action.reduce(currentState);

      // Assert
      expect(newState.errors).toEqual([]);
    });

    test("should return a new state object", () => {
      // Set up
      const currentState: StoryState = mockStoryState({
        errors: [
          {
            message: "Error to clear",
            severity: "error",
          },
        ],
      });

      // Execute
      const newState = action.reduce(currentState);

      // Assert
      expect(newState).not.toBe(currentState);
      expect(newState).toEqual(mockStoryState({ errors: [] }));
    });
  });
});
