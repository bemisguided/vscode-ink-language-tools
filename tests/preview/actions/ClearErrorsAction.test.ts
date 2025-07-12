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
import { ErrorInfo } from "../../../src/preview/ErrorInfo";

describe("ClearErrorsAction", () => {
  let action: ClearErrorsAction;

  beforeEach(() => {
    action = new ClearErrorsAction();
  });

  describe("reduce", () => {
    it("should clear all errors from state", () => {
      // Setup
      const errors: ErrorInfo[] = [
        { message: "Test error 1", severity: "error" },
        { message: "Test warning", severity: "warning" },
        { message: "Test info", severity: "info" },
      ];

      const state: PreviewState = {
        storyEvents: [],
        currentChoices: [],
        errors,
        isEnded: false,
        isStart: false,
        metadata: {
          title: "Test Story",
          fileName: "test.ink",
        },
      };

      // Execute
      const newState = action.reduce(state);

      // Assert
      expect(newState.errors).toEqual([]);
      expect(newState.errors).toHaveLength(0);
    });

    it("should preserve all other state properties", () => {
      // Setup
      const initialState: PreviewState = {
        storyEvents: [{ type: "text", text: "Test event", tags: ["tag1"] }],
        currentChoices: [{ index: 0, text: "Choice 1", tags: ["choice"] }],
        errors: [{ message: "Error to clear", severity: "error" }],
        isEnded: true,
        isStart: false,
        metadata: {
          title: "Test Story",
          fileName: "test.ink",
        },
      };

      // Execute
      const newState = action.reduce(initialState);

      // Assert
      expect(newState.storyEvents).toEqual(initialState.storyEvents);
      expect(newState.currentChoices).toEqual(initialState.currentChoices);
      expect(newState.isEnded).toBe(initialState.isEnded);
      expect(newState.isStart).toBe(initialState.isStart);
      expect(newState.metadata).toEqual(initialState.metadata);
    });

    it("should not mutate the original state", () => {
      // Setup
      const originalErrors: ErrorInfo[] = [
        { message: "Original error", severity: "error" },
      ];

      const originalState: PreviewState = {
        storyEvents: [],
        currentChoices: [],
        errors: originalErrors,
        isEnded: false,
        isStart: false,
        metadata: {
          title: "Test Story",
          fileName: "test.ink",
        },
      };

      const originalStateCopy = JSON.parse(JSON.stringify(originalState));

      // Execute
      action.reduce(originalState);

      // Assert
      expect(originalState).toEqual(originalStateCopy);
      expect(originalState.errors).toEqual(originalErrors);
    });

    it("should handle empty errors array", () => {
      // Setup
      const state: PreviewState = {
        storyEvents: [],
        currentChoices: [],
        errors: [],
        isEnded: false,
        isStart: false,
        metadata: {
          title: "Test Story",
          fileName: "test.ink",
        },
      };

      // Execute
      const newState = action.reduce(state);

      // Assert
      expect(newState.errors).toEqual([]);
      expect(newState.errors).toHaveLength(0);
    });

    it("should handle complex state with multiple errors", () => {
      // Setup
      const complexErrors: ErrorInfo[] = [
        { message: "Runtime error in line 42", severity: "error" },
        { message: "Deprecated function used", severity: "warning" },
        { message: "Consider optimizing this section", severity: "info" },
        {
          message: 'Another error with special chars: <>"&',
          severity: "error",
        },
      ];

      const state: PreviewState = {
        storyEvents: [
          { type: "text", text: "Complex story content", tags: ["complex"] },
          {
            type: "function",
            functionName: "testFunc",
            args: [1, 2],
            result: 3,
          },
        ],
        currentChoices: [
          { index: 0, text: "Complex choice", tags: ["complex"] },
        ],
        errors: complexErrors,
        isEnded: false,
        isStart: true,
        metadata: {
          title: "Complex Story",
          fileName: "complex.ink",
        },
      };

      // Execute
      const newState = action.reduce(state);

      // Assert
      expect(newState.errors).toEqual([]);
      expect(newState.errors).toHaveLength(0);

      // Verify all other properties are preserved
      expect(newState.storyEvents).toEqual(state.storyEvents);
      expect(newState.currentChoices).toEqual(state.currentChoices);
      expect(newState.isEnded).toBe(state.isEnded);
      expect(newState.isStart).toBe(state.isStart);
      expect(newState.metadata).toEqual(state.metadata);
    });

    it("should return a new state object", () => {
      // Setup
      const state: PreviewState = {
        storyEvents: [],
        currentChoices: [],
        errors: [{ message: "Test error", severity: "error" }],
        isEnded: false,
        isStart: false,
        metadata: {
          title: "Test Story",
          fileName: "test.ink",
        },
      };

      // Execute
      const newState = action.reduce(state);

      // Assert
      expect(newState).not.toBe(state);
      expect(newState.errors).not.toBe(state.errors);
    });
  });
});
