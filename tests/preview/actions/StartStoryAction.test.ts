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
import { ErrorInfo } from "../../../src/preview/ErrorInfo";

describe("StartStoryAction", () => {
  let action: StartStoryAction;

  beforeEach(() => {
    action = new StartStoryAction();
  });

  describe("reduce", () => {
    test("should reset state to initial starting state", () => {
      // Arrange
      const currentState: PreviewState = {
        storyEvents: [
          {
            type: "text",
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
        metadata: {
          title: "Test Story",
          fileName: "/path/to/test.ink",
        },
      };

      // Act
      const newState = action.reduce(currentState);

      // Assert
      expect(newState.storyEvents).toEqual([]);
      expect(newState.currentChoices).toEqual([]);
      expect(newState.errors).toEqual([]);
      expect(newState.isEnded).toBe(false);
      expect(newState.isStart).toBe(true);
    });

    test("should preserve existing metadata unchanged", () => {
      // Arrange
      const currentState: PreviewState = {
        storyEvents: [],
        currentChoices: [],
        errors: [],
        isEnded: false,
        isStart: false,
        metadata: {
          title: "Test Story",
          fileName: "/path/to/test.ink",
        },
      };

      // Act
      const newState = action.reduce(currentState);

      // Assert
      expect(newState.metadata.title).toBe("Test Story");
      expect(newState.metadata.fileName).toBe("/path/to/test.ink");
    });

    test("should handle empty initial state", () => {
      // Arrange
      const currentState: PreviewState = {
        storyEvents: [],
        currentChoices: [],
        errors: [],
        isEnded: false,
        isStart: false,
        metadata: {
          title: "Test Story",
          fileName: "/path/to/test.ink",
        },
      };

      // Act
      const newState = action.reduce(currentState);

      // Assert
      expect(newState.storyEvents).toEqual([]);
      expect(newState.currentChoices).toEqual([]);
      expect(newState.errors).toEqual([]);
      expect(newState.isEnded).toBe(false);
      expect(newState.isStart).toBe(true);
    });

    test("should not mutate the original state", () => {
      // Arrange
      const originalErrors: ErrorInfo[] = [
        {
          message: "Original error",
          severity: "error",
        },
      ];
      const originalMetadata = {
        title: "Original Story",
        fileName: "/path/to/original.ink",
      };
      const currentState: PreviewState = {
        storyEvents: [
          {
            type: "text",
            text: "Original text",
            tags: [],
          },
        ],
        currentChoices: [
          {
            index: 0,
            text: "Original choice",
            tags: [],
          },
        ],
        errors: originalErrors,
        isEnded: true,
        isStart: false,
        metadata: originalMetadata,
      };

      // Act
      const newState = action.reduce(currentState);

      // Assert - original state should be unchanged
      expect(currentState.storyEvents).toHaveLength(1);
      expect(currentState.currentChoices).toHaveLength(1);
      expect(currentState.errors).toHaveLength(1);
      expect(currentState.isEnded).toBe(true);
      expect(currentState.isStart).toBe(false);
      expect(currentState.metadata.title).toBe("Original Story");
      expect(currentState.metadata.fileName).toBe("/path/to/original.ink");

      // New state should be different
      expect(newState.storyEvents).toHaveLength(0);
      expect(newState.currentChoices).toHaveLength(0);
      expect(newState.errors).toHaveLength(0);
      expect(newState.isEnded).toBe(false);
      expect(newState.isStart).toBe(true);
    });
  });
});
