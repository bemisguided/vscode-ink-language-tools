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

import { InitializeStoryAction } from "../../../src/preview/actions/InitializeStoryAction";
import { PreviewState } from "../../../src/preview/PreviewState";
import { ErrorInfo } from "../../../src/preview/ErrorInfo";

describe("InitializeStoryAction", () => {
  describe("reduce", () => {
    test("should set metadata title and fileName", () => {
      // Arrange
      const action = new InitializeStoryAction(
        "My Story",
        "/path/to/story.ink"
      );
      const currentState: PreviewState = {
        storyEvents: [],
        currentChoices: [],
        errors: [],
        isEnded: false,
        isStart: false,
        metadata: {
          title: "Old Title",
          fileName: "/old/path.ink",
        },
      };

      // Act
      const newState = action.reduce(currentState);

      // Assert
      expect(newState.metadata.title).toBe("My Story");
      expect(newState.metadata.fileName).toBe("/path/to/story.ink");
    });

    test("should preserve all other state properties unchanged", () => {
      // Arrange
      const action = new InitializeStoryAction("Test Story", "/test/path.ink");
      const currentState: PreviewState = {
        storyEvents: [
          {
            type: "text",
            text: "Existing text",
            tags: ["tag1"],
          },
        ],
        currentChoices: [
          {
            index: 0,
            text: "Choice 1",
            tags: ["choice-tag"],
          },
        ],
        errors: [
          {
            message: "Some error",
            severity: "error",
          },
        ],
        isEnded: true,
        isStart: true,
        metadata: {
          title: "Old Title",
          fileName: "/old/path.ink",
        },
      };

      // Act
      const newState = action.reduce(currentState);

      // Assert
      expect(newState.storyEvents).toEqual(currentState.storyEvents);
      expect(newState.currentChoices).toEqual(currentState.currentChoices);
      expect(newState.errors).toEqual(currentState.errors);
      expect(newState.isEnded).toBe(true);
      expect(newState.isStart).toBe(true);
      expect(newState.metadata.title).toBe("Test Story");
      expect(newState.metadata.fileName).toBe("/test/path.ink");
    });

    test("should work with empty strings", () => {
      // Arrange
      const action = new InitializeStoryAction("", "");
      const currentState: PreviewState = {
        storyEvents: [],
        currentChoices: [],
        errors: [],
        isEnded: false,
        isStart: false,
        metadata: {
          title: "Old Title",
          fileName: "/old/path.ink",
        },
      };

      // Act
      const newState = action.reduce(currentState);

      // Assert
      expect(newState.metadata.title).toBe("");
      expect(newState.metadata.fileName).toBe("");
    });

    test("should not mutate the original state", () => {
      // Arrange
      const action = new InitializeStoryAction("New Title", "/new/path.ink");
      const originalErrors: ErrorInfo[] = [
        {
          message: "Original error",
          severity: "warning",
        },
      ];
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
        isEnded: false,
        isStart: true,
        metadata: {
          title: "Original Title",
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
      expect(currentState.metadata.title).toBe("Original Title");
      expect(currentState.metadata.fileName).toBe("/original/path.ink");

      // New state should have updated metadata
      expect(newState.storyEvents).toHaveLength(1);
      expect(newState.currentChoices).toHaveLength(1);
      expect(newState.errors).toHaveLength(1);
      expect(newState.isEnded).toBe(false);
      expect(newState.isStart).toBe(true);
      expect(newState.metadata.title).toBe("New Title");
      expect(newState.metadata.fileName).toBe("/new/path.ink");
    });

    test("should handle different file paths and titles", () => {
      // Arrange
      const testCases = [
        {
          title: "Adventure Story",
          fileName: "/Users/test/Documents/adventure.ink",
        },
        {
          title: "Short Story",
          fileName: "C:\\Projects\\story.ink",
        },
        {
          title: "Story with Special Characters àáâãäåæçèéêë",
          fileName: "/path/with spaces/file-name.ink",
        },
      ];

      const baseState: PreviewState = {
        storyEvents: [],
        currentChoices: [],
        errors: [],
        isEnded: false,
        isStart: false,
        metadata: {
          title: "Base Title",
          fileName: "/base/path.ink",
        },
      };

      testCases.forEach(({ title, fileName }) => {
        // Arrange
        const action = new InitializeStoryAction(title, fileName);

        // Act
        const newState = action.reduce(baseState);

        // Assert
        expect(newState.metadata.title).toBe(title);
        expect(newState.metadata.fileName).toBe(fileName);
      });
    });
  });
});
