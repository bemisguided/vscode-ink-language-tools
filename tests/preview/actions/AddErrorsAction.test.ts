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
import { mockPreviewState } from "../../__mocks__/mockPreviewState";

describe("AddErrorsAction", () => {
  describe("reduce", () => {
    test("should add a single error to empty errors array", () => {
      // Set up
      const newError: ErrorInfo = {
        message: "Something went wrong",
        severity: "error",
      };
      const action = new AddErrorsAction([newError]);
      const currentState: PreviewState = mockPreviewState({
        errors: [],
      });

      // Execute
      const newState = action.reduce(currentState);

      // Assert
      expect(newState.errors).toHaveLength(1);
      expect(newState.errors[0]).toEqual(newError);
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
      const currentState: PreviewState = mockPreviewState({
        errors: [],
      });

      // Execute
      const newState = action.reduce(currentState);

      // Assert
      expect(newState.errors).toHaveLength(3);
      expect(newState.errors).toEqual(newErrors);
    });

    test("should append errors to existing errors array", () => {
      // Set up
      const existingErrors: ErrorInfo[] = [
        {
          message: "Existing error",
          severity: "error",
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
      const currentState: PreviewState = mockPreviewState({
        errors: existingErrors,
      });

      // Execute
      const newState = action.reduce(currentState);

      // Assert
      expect(newState.errors).toHaveLength(3);
      expect(newState.errors).toEqual([...existingErrors, ...newErrors]);
    });

    test("should preserve all other state properties", () => {
      // Set up
      const newError: ErrorInfo = {
        message: "Test error",
        severity: "error",
      };
      const action = new AddErrorsAction([newError]);
      const currentState: PreviewState = mockPreviewState({
        storyEvents: [
          {
            type: "text" as const,
            text: "Story content",
            tags: ["test"],
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
        lastChoiceIndex: 5,
        metadata: {
          title: "Test Story",
          fileName: "/path/to/test.ink",
        },
      });

      // Execute
      const newState = action.reduce(currentState);

      // Assert
      expect(newState.storyEvents).toEqual(currentState.storyEvents);
      expect(newState.currentChoices).toEqual(currentState.currentChoices);
      expect(newState.isEnded).toBe(true);
      expect(newState.isStart).toBe(false);
      expect(newState.lastChoiceIndex).toBe(5);
      expect(newState.metadata).toEqual(currentState.metadata);
    });

    test("should handle empty errors array input", () => {
      // Set up
      const action = new AddErrorsAction([]);
      const currentState: PreviewState = mockPreviewState({
        errors: [
          {
            message: "Existing error",
            severity: "error",
          },
        ],
      });

      // Execute
      const newState = action.reduce(currentState);

      // Assert
      expect(newState.errors).toHaveLength(1);
      expect(newState.errors[0]).toEqual({
        message: "Existing error",
        severity: "error",
      });
    });

    test("should return a new state object", () => {
      // Set up
      const newError: ErrorInfo = {
        message: "Test error",
        severity: "error",
      };
      const action = new AddErrorsAction([newError]);
      const currentState: PreviewState = mockPreviewState();

      // Execute
      const newState = action.reduce(currentState);

      // Assert
      expect(newState).not.toBe(currentState);
      expect(newState).toEqual(mockPreviewState({ errors: [newError] }));
    });
  });

  describe("Edge cases", () => {
    test("should handle duplicate errors", () => {
      // Set up
      const duplicateError: ErrorInfo = {
        message: "Duplicate error",
        severity: "error",
      };
      const action = new AddErrorsAction([duplicateError, duplicateError]);
      const currentState: PreviewState = mockPreviewState({
        errors: [duplicateError],
      });

      // Execute
      const newState = action.reduce(currentState);

      // Assert
      expect(newState.errors).toHaveLength(3);
      expect(newState.errors).toEqual([
        duplicateError,
        duplicateError,
        duplicateError,
      ]);
    });

    test("should handle errors with long messages", () => {
      // Set up
      const longMessage = "A".repeat(1000);
      const longError: ErrorInfo = {
        message: longMessage,
        severity: "error",
      };
      const action = new AddErrorsAction([longError]);
      const currentState: PreviewState = mockPreviewState();

      // Execute
      const newState = action.reduce(currentState);

      // Assert
      expect(newState.errors).toHaveLength(1);
      expect(newState.errors[0].message).toBe(longMessage);
    });

    test("should handle errors with special characters", () => {
      // Set up
      const specialError: ErrorInfo = {
        message: "Error with special chars: àáâãäåæçèéêë 🔥💥",
        severity: "error",
      };
      const action = new AddErrorsAction([specialError]);
      const currentState: PreviewState = mockPreviewState();

      // Execute
      const newState = action.reduce(currentState);

      // Assert
      expect(newState.errors).toHaveLength(1);
      expect(newState.errors[0]).toEqual(specialError);
    });

    test("should handle mixed severity levels", () => {
      // Set up
      const mixedErrors: ErrorInfo[] = [
        {
          message: "Critical error",
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
      const action = new AddErrorsAction(mixedErrors);
      const currentState: PreviewState = mockPreviewState();

      // Execute
      const newState = action.reduce(currentState);

      // Assert
      expect(newState.errors).toHaveLength(3);
      expect(newState.errors).toEqual(mixedErrors);
    });
  });
});
