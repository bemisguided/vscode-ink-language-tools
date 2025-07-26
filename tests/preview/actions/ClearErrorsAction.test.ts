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

import { ClearErrorsAction } from "../../../src/preview/actions/ClearErrorsAction";
import { PreviewState } from "../../../src/preview/PreviewState";
import {
  ErrorInfo,
  PreviewStoryState,
} from "../../../src/preview/PreviewState";
import {
  mockPreviewState,
  mockPreviewStoryState,
} from "../../__mocks__/mockPreviewState";

describe("ClearErrorsAction", () => {
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
  let action: ClearErrorsAction;

  beforeEach(() => {
    action = new ClearErrorsAction();
  });

  describe("apply", () => {
    test("should clear all errors", () => {
      // Setup
      const error1: ErrorInfo = {
        message: "Error 1",
        severity: "error",
      };
      const error2: ErrorInfo = {
        message: "Warning 1",
        severity: "warning",
      };
      const error3: ErrorInfo = {
        message: "Info 1",
        severity: "info",
      };
      const errors: ErrorInfo[] = [error1, error2, error3];
      const currentState: PreviewState = setupState(errors);

      // Execute
      const newState = action.apply(currentState);

      // Assert
      expect(newState.story.errors).toEqual([]);
    });

    test("should preserve all other state properties", () => {
      // Setup
      const currentState: PreviewState = setupState([], {
        ...mockPreviewStoryState(),
        events: [
          {
            type: "text" as const,
            text: "Some story text",
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
      const newState = action.apply(currentState);

      // Assert
      expect(newState.story.events).toEqual(currentState.story.events);
      expect(newState.story.choices).toEqual(currentState.story.choices);
      expect(newState.story.isEnded).toBe(true);
      expect(newState.story.isStart).toBe(false);
      expect(newState.story.lastChoiceIndex).toBe(3);
    });

    test("should work when errors array is already empty", () => {
      // Setup
      const currentState: PreviewState = setupState([]);

      // Execute
      const newState = action.apply(currentState);

      // Assert
      expect(newState.story.errors).toEqual([]);
    });
  });
});
