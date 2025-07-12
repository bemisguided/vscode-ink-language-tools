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

import { SetCurrentChoicesAction } from "../../../src/preview/actions/SetCurrentChoicesAction";
import { PreviewState } from "../../../src/preview/PreviewState";
import { Choice } from "../../../src/preview/types";

describe("SetCurrentChoicesAction", () => {
  describe("reduce", () => {
    test("should set choices when currentChoices is empty", () => {
      // Arrange
      const newChoices: Choice[] = [
        {
          index: 0,
          text: "Go north",
          tags: ["direction"],
        },
        {
          index: 1,
          text: "Go south",
          tags: ["direction"],
        },
      ];
      const action = new SetCurrentChoicesAction(newChoices);
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
      expect(newState.currentChoices).toHaveLength(2);
      expect(newState.currentChoices).toEqual(newChoices);
    });

    test("should replace existing choices", () => {
      // Arrange
      const existingChoices: Choice[] = [
        {
          index: 0,
          text: "Old choice 1",
          tags: ["old"],
        },
        {
          index: 1,
          text: "Old choice 2",
          tags: ["old"],
        },
      ];
      const newChoices: Choice[] = [
        {
          index: 0,
          text: "New choice",
          tags: ["new"],
        },
      ];
      const action = new SetCurrentChoicesAction(newChoices);
      const currentState: PreviewState = {
        storyEvents: [],
        currentChoices: existingChoices,
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
      expect(newState.currentChoices).toHaveLength(1);
      expect(newState.currentChoices).toEqual(newChoices);
      expect(newState.currentChoices).not.toEqual(existingChoices);
    });

    test("should set empty choices array", () => {
      // Arrange
      const existingChoices: Choice[] = [
        {
          index: 0,
          text: "Existing choice",
          tags: [],
        },
      ];
      const action = new SetCurrentChoicesAction([]);
      const currentState: PreviewState = {
        storyEvents: [],
        currentChoices: existingChoices,
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
      expect(newState.currentChoices).toHaveLength(0);
      expect(newState.currentChoices).toEqual([]);
    });

    test("should preserve all other state properties unchanged", () => {
      // Arrange
      const newChoices: Choice[] = [
        {
          index: 0,
          text: "Test choice",
          tags: ["test"],
        },
      ];
      const action = new SetCurrentChoicesAction(newChoices);
      const currentState: PreviewState = {
        storyEvents: [
          {
            type: "text",
            text: "Story text",
            tags: ["story"],
          },
        ],
        currentChoices: [],
        errors: [
          {
            message: "Error message",
            severity: "error",
          },
        ],
        isEnded: true,
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
      expect(newState.errors).toEqual(currentState.errors);
      expect(newState.isEnded).toBe(true);
      expect(newState.isStart).toBe(true);
      expect(newState.metadata).toEqual(currentState.metadata);
      expect(newState.currentChoices).toEqual(newChoices);
    });

    test("should not mutate the original state", () => {
      // Arrange
      const originalChoices: Choice[] = [
        {
          index: 0,
          text: "Original choice",
          tags: ["original"],
        },
      ];
      const newChoices: Choice[] = [
        {
          index: 0,
          text: "New choice",
          tags: ["new"],
        },
      ];
      const action = new SetCurrentChoicesAction(newChoices);
      const currentState: PreviewState = {
        storyEvents: [],
        currentChoices: originalChoices,
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

      // Assert - original state should be unchanged
      expect(currentState.currentChoices).toHaveLength(1);
      expect(currentState.currentChoices[0]).toEqual(originalChoices[0]);

      // New state should have new choices
      expect(newState.currentChoices).toHaveLength(1);
      expect(newState.currentChoices[0]).toEqual(newChoices[0]);
    });

    test("should handle single choice", () => {
      // Arrange
      const singleChoice: Choice[] = [
        {
          index: 0,
          text: "Continue",
          tags: ["continue"],
        },
      ];
      const action = new SetCurrentChoicesAction(singleChoice);
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
      expect(newState.currentChoices).toHaveLength(1);
      expect(newState.currentChoices[0]).toEqual(singleChoice[0]);
    });

    test("should handle multiple choices", () => {
      // Arrange
      const multipleChoices: Choice[] = [
        {
          index: 0,
          text: "First choice",
          tags: ["1"],
        },
        {
          index: 1,
          text: "Second choice",
          tags: ["2"],
        },
        {
          index: 2,
          text: "Third choice",
          tags: ["3"],
        },
        {
          index: 3,
          text: "Fourth choice",
          tags: ["4"],
        },
      ];
      const action = new SetCurrentChoicesAction(multipleChoices);
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
      expect(newState.currentChoices).toHaveLength(4);
      expect(newState.currentChoices).toEqual(multipleChoices);
    });

    test("should handle choices with complex content", () => {
      // Arrange
      const complexChoices: Choice[] = [
        {
          index: 0,
          text: "Choice with\nnewlines\tand\ttabs and special chars: àáâãäåæçèéêë",
          tags: ["complex", "unicode", "àáâãäåæçèéêë"],
        },
        {
          index: 1,
          text: "Choice with empty tags",
          tags: [],
        },
        {
          index: 2,
          text: "Choice with many tags",
          tags: ["tag1", "tag2", "tag3", "tag4", "tag5"],
        },
      ];
      const action = new SetCurrentChoicesAction(complexChoices);
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
      expect(newState.currentChoices).toHaveLength(3);
      expect(newState.currentChoices).toEqual(complexChoices);
    });

    test("should maintain choice order", () => {
      // Arrange
      const orderedChoices: Choice[] = [
        {
          index: 3,
          text: "Third index first",
          tags: ["3"],
        },
        {
          index: 1,
          text: "First index second",
          tags: ["1"],
        },
        {
          index: 2,
          text: "Second index third",
          tags: ["2"],
        },
      ];
      const action = new SetCurrentChoicesAction(orderedChoices);
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
      expect(newState.currentChoices).toHaveLength(3);
      expect(newState.currentChoices[0].index).toBe(3);
      expect(newState.currentChoices[1].index).toBe(1);
      expect(newState.currentChoices[2].index).toBe(2);
      expect(newState.currentChoices).toEqual(orderedChoices);
    });
  });
});
