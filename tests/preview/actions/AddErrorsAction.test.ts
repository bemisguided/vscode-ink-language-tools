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
import { ErrorInfo } from "../../../src/preview/ErrorInfo";

describe("AddErrorsAction", () => {
  describe("reduce", () => {
    test("should add a single error to empty errors array", () => {
      // Arrange
      const newError: ErrorInfo = {
        message: "Something went wrong",
        severity: "error",
      };
      const action = new AddErrorsAction([newError]);
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
      expect(newState.errors).toHaveLength(1);
      expect(newState.errors[0]).toEqual(newError);
    });

    test("should add multiple errors to empty errors array", () => {
      // Arrange
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
      expect(newState.errors).toHaveLength(3);
      expect(newState.errors).toEqual(newErrors);
    });

    test("should append errors to existing errors", () => {
      // Arrange
      const existingErrors: ErrorInfo[] = [
        {
          message: "Existing error",
          severity: "error",
        },
      ];
      const newErrors: ErrorInfo[] = [
        {
          message: "New warning",
          severity: "warning",
        },
      ];
      const action = new AddErrorsAction(newErrors);
      const currentState: PreviewState = {
        storyEvents: [],
        currentChoices: [],
        errors: existingErrors,
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
      expect(newState.errors).toHaveLength(2);
      expect(newState.errors[0]).toEqual(existingErrors[0]);
      expect(newState.errors[1]).toEqual(newErrors[0]);
    });

    test("should handle empty errors array", () => {
      // Arrange
      const existingErrors: ErrorInfo[] = [
        {
          message: "Existing error",
          severity: "info",
        },
      ];
      const action = new AddErrorsAction([]);
      const currentState: PreviewState = {
        storyEvents: [],
        currentChoices: [],
        errors: existingErrors,
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
      expect(newState.errors).toHaveLength(1);
      expect(newState.errors).toEqual(existingErrors);
    });

    test("should preserve all other state properties unchanged", () => {
      // Arrange
      const newError: ErrorInfo = {
        message: "New error",
        severity: "error",
      };
      const action = new AddErrorsAction([newError]);
      const currentState: PreviewState = {
        storyEvents: [
          {
            type: "text",
            text: "Story text",
            tags: ["story"],
          },
        ],
        currentChoices: [
          {
            index: 0,
            text: "Choice 1",
            tags: ["choice"],
          },
        ],
        errors: [],
        isEnded: true,
        isStart: false,
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
      expect(newState.isEnded).toBe(true);
      expect(newState.isStart).toBe(false);
      expect(newState.metadata).toEqual(currentState.metadata);
      expect(newState.errors).toHaveLength(1);
      expect(newState.errors[0]).toEqual(newError);
    });

    test("should not mutate the original state", () => {
      // Arrange
      const originalErrors: ErrorInfo[] = [
        {
          message: "Original error",
          severity: "warning",
        },
      ];
      const newErrors: ErrorInfo[] = [
        {
          message: "New error",
          severity: "error",
        },
      ];
      const action = new AddErrorsAction(newErrors);
      const currentState: PreviewState = {
        storyEvents: [],
        currentChoices: [],
        errors: originalErrors,
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
      expect(currentState.errors).toHaveLength(1);
      expect(currentState.errors[0]).toEqual(originalErrors[0]);

      // New state should have both errors
      expect(newState.errors).toHaveLength(2);
      expect(newState.errors[0]).toEqual(originalErrors[0]);
      expect(newState.errors[1]).toEqual(newErrors[0]);
    });

    test("should handle different error severities", () => {
      // Arrange
      const errorSeverities: ErrorInfo[] = [
        {
          message: "Critical error",
          severity: "error",
        },
        {
          message: "Warning message",
          severity: "warning",
        },
        {
          message: "Information",
          severity: "info",
        },
      ];
      const action = new AddErrorsAction(errorSeverities);
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
      expect(newState.errors).toHaveLength(3);
      expect(newState.errors[0].severity).toBe("error");
      expect(newState.errors[1].severity).toBe("warning");
      expect(newState.errors[2].severity).toBe("info");
      expect(newState.errors).toEqual(errorSeverities);
    });

    test("should handle errors with complex messages", () => {
      // Arrange
      const complexErrors: ErrorInfo[] = [
        {
          message:
            "Error with\nnewlines\tand\ttabs and special chars: àáâãäåæçèéêë",
          severity: "error",
        },
        {
          message:
            "Long error message with multiple sentences. This error occurred during story processing. The operation failed due to invalid input.",
          severity: "warning",
        },
        {
          message:
            "Error with quotes 'single' and \"double\" and symbols: !@#$%^&*()",
          severity: "info",
        },
      ];
      const action = new AddErrorsAction(complexErrors);
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
      expect(newState.errors).toHaveLength(3);
      expect(newState.errors).toEqual(complexErrors);
    });

    test("should maintain chronological order of errors", () => {
      // Arrange
      const existingErrors: ErrorInfo[] = [
        {
          message: "First error",
          severity: "error",
        },
        {
          message: "Second error",
          severity: "warning",
        },
      ];
      const newErrors: ErrorInfo[] = [
        {
          message: "Third error",
          severity: "info",
        },
        {
          message: "Fourth error",
          severity: "error",
        },
      ];
      const action = new AddErrorsAction(newErrors);
      const currentState: PreviewState = {
        storyEvents: [],
        currentChoices: [],
        errors: existingErrors,
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
      expect(newState.errors).toHaveLength(4);
      expect(newState.errors[0].message).toBe("First error");
      expect(newState.errors[1].message).toBe("Second error");
      expect(newState.errors[2].message).toBe("Third error");
      expect(newState.errors[3].message).toBe("Fourth error");
    });

    test("should handle batch of same severity errors", () => {
      // Arrange
      const batchErrors: ErrorInfo[] = [
        {
          message: "Runtime error 1",
          severity: "error",
        },
        {
          message: "Runtime error 2",
          severity: "error",
        },
        {
          message: "Runtime error 3",
          severity: "error",
        },
      ];
      const action = new AddErrorsAction(batchErrors);
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
      expect(newState.errors).toHaveLength(3);
      expect(newState.errors.every((error) => error.severity === "error")).toBe(
        true
      );
      expect(newState.errors).toEqual(batchErrors);
    });

    test("should handle mixed existing and new error severities", () => {
      // Arrange
      const existingErrors: ErrorInfo[] = [
        {
          message: "Existing info",
          severity: "info",
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
      const currentState: PreviewState = {
        storyEvents: [],
        currentChoices: [],
        errors: existingErrors,
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
      expect(newState.errors).toHaveLength(3);
      expect(newState.errors[0].severity).toBe("info");
      expect(newState.errors[1].severity).toBe("error");
      expect(newState.errors[2].severity).toBe("warning");
    });
  });
});
