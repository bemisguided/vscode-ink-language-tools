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
import { ErrorInfo } from "../../../src/preview/ErrorInfo";

describe("EndStoryAction", () => {
  let action: EndStoryAction;

  beforeEach(() => {
    action = new EndStoryAction();
  });

  describe("reduce", () => {
    test("should set isEnded to true and isStart to false", () => {
      // Arrange
      const currentState: PreviewState = {
        storyEvents: [],
        currentChoices: [],
        errors: [],
        isEnded: false,
        isStart: true,
        metadata: {
          title: "Test Story",
          fileName: "/path/to/test.ink",
        },
      };

      // Act
      const newState = action.reduce(currentState);

      // Assert
      expect(newState.isEnded).toBe(true);
      expect(newState.isStart).toBe(false);
    });

    test("should preserve all other state properties unchanged", () => {
      // Arrange
      const currentState: PreviewState = {
        storyEvents: [
          {
            type: "text",
            text: "Story text",
            tags: ["tag1", "tag2"],
          },
          {
            type: "function",
            functionName: "testFunction",
            args: ["arg1", 123],
            result: "result",
          },
        ],
        currentChoices: [
          {
            index: 0,
            text: "Choice 1",
            tags: ["choice-tag"],
          },
          {
            index: 1,
            text: "Choice 2",
            tags: [],
          },
        ],
        errors: [
          {
            message: "Error message",
            severity: "error",
          },
          {
            message: "Warning message",
            severity: "warning",
          },
        ],
        isEnded: false,
        isStart: true,
        metadata: {
          title: "My Story",
          fileName: "/path/to/story.ink",
        },
      };

      // Act
      const newState = action.reduce(currentState);

      // Assert
      expect(newState.storyEvents).toEqual(currentState.storyEvents);
      expect(newState.currentChoices).toEqual(currentState.currentChoices);
      expect(newState.errors).toEqual(currentState.errors);
      expect(newState.metadata).toEqual(currentState.metadata);
      expect(newState.isEnded).toBe(true);
      expect(newState.isStart).toBe(false);
    });

    test("should work when story is already ended", () => {
      // Arrange
      const currentState: PreviewState = {
        storyEvents: [],
        currentChoices: [],
        errors: [],
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
      expect(newState.isEnded).toBe(true);
      expect(newState.isStart).toBe(false);
    });

    test("should work when isStart is already false", () => {
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
      expect(newState.isEnded).toBe(true);
      expect(newState.isStart).toBe(false);
    });

    test("should not mutate the original state", () => {
      // Arrange
      const originalErrors: ErrorInfo[] = [
        {
          message: "Original error",
          severity: "info",
        },
      ];
      const currentState: PreviewState = {
        storyEvents: [
          {
            type: "text",
            text: "Original text",
            tags: ["original-tag"],
          },
        ],
        currentChoices: [
          {
            index: 0,
            text: "Original choice",
            tags: ["original-choice-tag"],
          },
        ],
        errors: originalErrors,
        isEnded: false,
        isStart: true,
        metadata: {
          title: "Original Story",
          fileName: "/original/path.ink",
        },
      };

      // Act
      const newState = action.reduce(currentState);

      // Assert - original state should be unchanged
      expect(currentState.storyEvents).toHaveLength(1);
      expect(currentState.currentChoices).toHaveLength(1);
      expect(currentState.errors).toHaveLength(1);
      expect(currentState.isEnded).toBe(false);
      expect(currentState.isStart).toBe(true);
      expect(currentState.metadata.title).toBe("Original Story");
      expect(currentState.metadata.fileName).toBe("/original/path.ink");

      // New state should have updated flags
      expect(newState.storyEvents).toHaveLength(1);
      expect(newState.currentChoices).toHaveLength(1);
      expect(newState.errors).toHaveLength(1);
      expect(newState.isEnded).toBe(true);
      expect(newState.isStart).toBe(false);
      expect(newState.metadata.title).toBe("Original Story");
      expect(newState.metadata.fileName).toBe("/original/path.ink");
    });

    test("should handle edge cases with complex state", () => {
      // Arrange
      const currentState: PreviewState = {
        storyEvents: [
          {
            type: "text",
            text: "Text with\nnewlines\tand\ttabs",
            tags: ["special", "characters", "àáâãäåæçèéêë"],
          },
        ],
        currentChoices: [
          {
            index: 0,
            text: "Choice with special chars: àáâãäåæçèéêë",
            tags: ["unicode", "test"],
          },
        ],
        errors: [
          {
            message: "Error with special chars: àáâãäåæçèéêë",
            severity: "error",
          },
        ],
        isEnded: false,
        isStart: true,
        metadata: {
          title: "Story àáâãäåæçèéêë",
          fileName: "/path/with spaces/àáâãäåæçèéêë.ink",
        },
      };

      // Act
      const newState = action.reduce(currentState);

      // Assert
      expect(newState.isEnded).toBe(true);
      expect(newState.isStart).toBe(false);
      expect(newState.storyEvents).toEqual(currentState.storyEvents);
      expect(newState.currentChoices).toEqual(currentState.currentChoices);
      expect(newState.errors).toEqual(currentState.errors);
      expect(newState.metadata).toEqual(currentState.metadata);
    });
  });
});
