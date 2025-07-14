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
import { mockPreviewState } from "../../__mocks__/mockPreviewState";

describe("EndStoryAction", () => {
  let action: EndStoryAction;

  beforeEach(() => {
    action = new EndStoryAction();
  });

  describe("reduce", () => {
    test("should set isEnded to true", () => {
      // Set up
      const currentState: PreviewState = mockPreviewState({
        isEnded: false,
      });

      // Execute
      const newState = action.reduce(currentState);

      // Assert
      expect(newState.isEnded).toBe(true);
    });

    test("should preserve all other state properties", () => {
      // Set up
      const currentState: PreviewState = mockPreviewState({
        storyEvents: [
          {
            type: "text" as const,
            text: "Some story text",
            tags: ["ending"],
          },
        ],
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
      const newState = action.reduce(currentState);

      // Assert
      expect(newState.storyEvents).toEqual(currentState.storyEvents);
      expect(newState.currentChoices).toEqual(currentState.currentChoices);
      expect(newState.errors).toEqual(currentState.errors);
      expect(newState.isStart).toBe(false);
      expect(newState.lastChoiceIndex).toBe(5);
    });

    test("should return a new state object", () => {
      // Set up
      const currentState: PreviewState = mockPreviewState();

      // Execute
      const newState = action.reduce(currentState);

      // Assert
      expect(newState).not.toBe(currentState);
      expect(newState).toEqual(mockPreviewState({ isEnded: true }));
    });

    test("should work when isEnded is already true", () => {
      // Set up
      const currentState: PreviewState = mockPreviewState({
        isEnded: true,
      });

      // Execute
      const newState = action.reduce(currentState);

      // Assert
      expect(newState.isEnded).toBe(true);
    });
  });
});
