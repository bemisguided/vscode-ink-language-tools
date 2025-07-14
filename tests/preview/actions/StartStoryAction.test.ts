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

import { StartStoryAction } from "../../../src/preview/actions/StartStoryAction";
import { PreviewState } from "../../../src/preview/PreviewState";
import { mockPreviewState } from "../../__mocks__/mockPreviewState";

describe("StartStoryAction", () => {
  let action: StartStoryAction;

  beforeEach(() => {
    action = new StartStoryAction();
  });

  describe("reduce", () => {
    test("should reset state to initial starting state", () => {
      // Set up
      const currentState: PreviewState = mockPreviewState({
        storyEvents: [
          {
            type: "text" as const,
            text: "Some existing text",
            tags: ["tag1"],
          },
        ],
        currentChoices: [
          {
            index: 0,
            text: "Choice 1",
            tags: [],
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
        lastChoiceIndex: 0,
      });

      // Execute
      const newState = action.reduce(currentState);

      // Assert
      expect(newState.storyEvents).toEqual([]);
      expect(newState.currentChoices).toEqual([]);
      expect(newState.errors).toEqual([]);
      expect(newState.isEnded).toBe(false);
      expect(newState.isStart).toBe(true);
    });

    test("should preserve existing state unchanged", () => {
      // Set up
      const currentState: PreviewState = mockPreviewState();

      // Execute
      const newState = action.reduce(currentState);

      // Assert
      expect(newState.storyEvents).toEqual([]);
      expect(newState.currentChoices).toEqual([]);
      expect(newState.errors).toEqual([]);
      expect(newState.isEnded).toBe(false);
      expect(newState.isStart).toBe(true);
      expect(newState.lastChoiceIndex).toBe(0);
    });

    test("should reset lastChoiceIndex to 0", () => {
      // Set up
      const currentState: PreviewState = mockPreviewState({
        lastChoiceIndex: 5,
      });

      // Execute
      const newState = action.reduce(currentState);

      // Assert
      expect(newState.lastChoiceIndex).toBe(0);
    });

    test("should return a new state object", () => {
      // Set up
      const currentState: PreviewState = mockPreviewState();

      // Execute
      const newState = action.reduce(currentState);

      // Assert
      expect(newState).not.toBe(currentState);
      expect(newState).toEqual(mockPreviewState({ isStart: true }));
    });
  });
});
