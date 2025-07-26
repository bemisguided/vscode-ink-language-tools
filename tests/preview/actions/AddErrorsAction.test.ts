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
import {
  PreviewState,
  PreviewStoryState,
} from "../../../src/preview/PreviewState";
import { ErrorInfo } from "../../../src/preview/PreviewState";
import {
  mockPreviewState,
  mockPreviewStoryState,
} from "../../__mocks__/mockPreviewState";

describe("AddErrorsAction", () => {
  function setupState(
    errors: ErrorInfo[] = [],
    story: PreviewStoryState = mockPreviewStoryState()
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
      const existingError: ErrorInfo = {
        message: "Existing error",
        severity: "error",
      };
      const newError1: ErrorInfo = {
        message: "New error",
        severity: "error",
      };
      const newError2: ErrorInfo = {
        message: "New warning",
        severity: "warning",
      };
      const action = new AddErrorsAction([newError1, newError2]);
      const previousState = setupState([existingError]);

      // Execute
      const newState = action.apply(previousState);

      // Assert
      expect(newState.story.errors).toHaveLength(3);
      expect(newState.story.errors).toEqual([
        existingError,
        newError1,
        newError2,
      ]);
    });

    test("should preserve all other state properties", () => {
      // Set up
      const newError: ErrorInfo = {
        message: "Test error",
        severity: "error",
      };
      const action = new AddErrorsAction([newError]);
      const currentState = setupState([], {
        ...mockPreviewStoryState(),
        events: [
          {
            type: "text" as const,
            text: "Story content",
            tags: ["test"],
          },
        ],
        choices: [
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
      expect(newState.story.events).toEqual(currentState.story.events);
      expect(newState.story.choices).toEqual(currentState.story.choices);
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
        mockPreviewStoryState()
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
