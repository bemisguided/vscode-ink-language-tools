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

import { AddErrorsAction } from "../../../src/preview/actions/AddErrorsAction";
import { PreviewState } from "../../../src/preview/PreviewState";
import { StoryState, ErrorInfo } from "../../../src/preview/StoryState";
import { mockPreviewState } from "../../__mocks__/mockPreviewState";
import { mockStoryState } from "../../__mocks__/mockStoryState";

describe("AddErrorsAction", () => {
  function setupState(
    errors: ErrorInfo[] = [],
    story: StoryState = mockStoryState()
  ): PreviewState {
    return {
      ...mockPreviewState(),
      story: {
        ...story,
        errors,
      },
    };
  }

  describe("apply", () => {
    test("should add a single error to empty errors array", () => {
      // Set up
      const newError: ErrorInfo = {
        message: "Something went wrong",
        severity: "error",
      };
      const action = new AddErrorsAction([newError]);
      const currentState = setupState();

      // Execute
      const newState = action.apply(currentState);

      // Assert
      expect(newState.story.errors).toHaveLength(1);
      expect(newState.story.errors[0]).toEqual(newError);
    });

    test("should add multiple errors to empty errors array", () => {
      // Set up
      const newErrors: ErrorInfo[] = [
        {
          message: "First error",
          severity: "error",
        },
        {
          message: "Warning message",
          severity: "warning",
        },
        {
          message: "Info message",
          severity: "info",
        },
      ];
      const action = new AddErrorsAction(newErrors);
      const currentState = mockPreviewState();

      // Execute
      const newState = action.apply(currentState);

      // Assert
      expect(newState.story.errors).toHaveLength(3);
      expect(newState.story.errors).toEqual(newErrors);
    });

    test("should append errors to existing errors array", () => {
      // Set up
      const existingErrors: ErrorInfo[] = [
        {
          message: "Existing error",
          severity: "error",
        },
      ];
      const newErrors: ErrorInfo[] = [
        {
          message: "New error",
          severity: "error",
        },
        {
          message: "New warning",
          severity: "warning",
        },
      ];
      const action = new AddErrorsAction(newErrors);
      const currentState = setupState(existingErrors);

      // Execute
      const newState = action.apply(currentState);

      // Assert
      expect(newState.story.errors).toHaveLength(3);
      expect(newState.story.errors).toEqual([...existingErrors, ...newErrors]);
    });

    test("should preserve all other state properties", () => {
      // Set up
      const newError: ErrorInfo = {
        message: "Test error",
        severity: "error",
      };
      const action = new AddErrorsAction([newError]);
      const currentState = setupState([], {
        ...mockStoryState(),
        storyEvents: [
          {
            type: "text" as const,
            text: "Story content",
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
      expect(newState.story.isEnded).toBe(currentState.story.isEnded);
      expect(newState.story.isStart).toBe(currentState.story.isStart);
      expect(newState.story.lastChoiceIndex).toBe(
        currentState.story.lastChoiceIndex
      );
      expect(newState.story.errors).toHaveLength(1);
      expect(newState.story.errors[0]).toEqual(newError);
    });

    test("should handle empty errors array input", () => {
      // Set up
      const action = new AddErrorsAction([]);
      const currentState = setupState(
        [
          {
            message: "Existing error",
            severity: "error",
          },
        ],
        mockStoryState()
      );

      // Execute
      const newState = action.apply(currentState);

      // Assert
      expect(newState.story.errors).toHaveLength(1);
      expect(newState.story.errors[0]).toEqual({
        message: "Existing error",
        severity: "error",
      });
    });
  });
});
