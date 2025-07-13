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
import { mockPreviewState } from "../../__mocks__/mockPreviewState";

describe("InitializeStoryAction", () => {
  describe("reduce", () => {
    test("should initialize story with provided metadata", () => {
      // Set up
      const title = "Adventure Story";
      const fileName = "/path/to/adventure.ink";
      const action = new InitializeStoryAction(title, fileName);
      const currentState: PreviewState = mockPreviewState();

      // Execute
      const newState = action.reduce(currentState);

      // Assert
      expect(newState.metadata).toEqual({
        title: title,
        fileName: fileName,
      });
      expect(newState.storyEvents).toEqual([]);
      expect(newState.currentChoices).toEqual([]);
      expect(newState.errors).toEqual([]);
      expect(newState.isEnded).toBe(false);
      expect(newState.isStart).toBe(false);
      expect(newState.lastChoiceIndex).toBe(0);
    });

    test("should replace existing metadata", () => {
      // Set up
      const newTitle = "New Story";
      const newFileName = "/new/path/story.ink";
      const action = new InitializeStoryAction(newTitle, newFileName);
      const currentState: PreviewState = mockPreviewState({
        metadata: {
          title: "Old Story",
          fileName: "/old/path/story.ink",
        },
      });

      // Execute
      const newState = action.reduce(currentState);

      // Assert
      expect(newState.metadata).toEqual({
        title: newTitle,
        fileName: newFileName,
      });
    });

    test("should preserve existing state data", () => {
      // Set up
      const title = "Test Story";
      const fileName = "/test/story.ink";
      const action = new InitializeStoryAction(title, fileName);
      const currentState: PreviewState = mockPreviewState({
        storyEvents: [
          {
            type: "text" as const,
            text: "Existing event",
            tags: ["existing"],
            isCurrent: true,
          },
        ],
        currentChoices: [
          {
            index: 0,
            text: "Existing choice",
            tags: ["choice"],
          },
        ],
        errors: [
          {
            message: "Existing error",
            severity: "error",
          },
        ],
        isEnded: true,
        isStart: true,
        lastChoiceIndex: 5,
      });

      // Execute
      const newState = action.reduce(currentState);

      // Assert
      expect(newState.storyEvents).toEqual(currentState.storyEvents);
      expect(newState.currentChoices).toEqual(currentState.currentChoices);
      expect(newState.errors).toEqual(currentState.errors);
      expect(newState.isEnded).toBe(true);
      expect(newState.isStart).toBe(true);
      expect(newState.lastChoiceIndex).toBe(5);
    });

    test("should return a new state object", () => {
      // Set up
      const title = "Test Story";
      const fileName = "/test/story.ink";
      const action = new InitializeStoryAction(title, fileName);
      const currentState: PreviewState = mockPreviewState();

      // Execute
      const newState = action.reduce(currentState);

      // Assert
      expect(newState).not.toBe(currentState);
      expect(newState).toEqual(
        mockPreviewState({
          metadata: {
            title: title,
            fileName: fileName,
          },
        })
      );
    });
  });

  describe("Edge cases", () => {
    test("should handle metadata with special characters", () => {
      // Set up
      const title = "Story with special chars: àáâãäåæçèéêë 🔥💥";
      const fileName = "/path/with spaces/àáâãäåæçèéêë.ink";
      const action = new InitializeStoryAction(title, fileName);
      const currentState: PreviewState = mockPreviewState();

      // Execute
      const newState = action.reduce(currentState);

      // Assert
      expect(newState.metadata).toEqual({
        title: title,
        fileName: fileName,
      });
    });

    test("should handle empty strings in metadata", () => {
      // Set up
      const title = "";
      const fileName = "";
      const action = new InitializeStoryAction(title, fileName);
      const currentState: PreviewState = mockPreviewState();

      // Execute
      const newState = action.reduce(currentState);

      // Assert
      expect(newState.metadata).toEqual({
        title: title,
        fileName: fileName,
      });
    });

    test("should handle long metadata values", () => {
      // Set up
      const title = "A".repeat(1000);
      const fileName = "/very/long/path/to/file/" + "B".repeat(500) + ".ink";
      const action = new InitializeStoryAction(title, fileName);
      const currentState: PreviewState = mockPreviewState();

      // Execute
      const newState = action.reduce(currentState);

      // Assert
      expect(newState.metadata).toEqual({
        title: title,
        fileName: fileName,
      });
    });
  });
});
