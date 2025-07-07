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

import { PreviewModel } from "../../src/preview/PreviewModel";
import {
  mockBuildResult,
  createMockSuccessfulBuildResult,
} from "../__mocks__/mockBuildResult";

describe("PreviewModel", () => {
  let model: PreviewModel;
  let errorCallback: jest.Mock;

  beforeEach(() => {
    model = new PreviewModel(mockBuildResult);
    errorCallback = jest.fn();
    model.onError(errorCallback);
  });

  describe("Story Execution", () => {
    test("should continue story successfully", () => {
      const update = model.continueStory();

      expect(update).toBeDefined();
      expect(update.events).toBeDefined();
      expect(update.choices).toBeDefined();
      expect(update.hasEnded).toBeDefined();
    });

    test("should handle story choices", () => {
      const initialUpdate = model.continueStory();

      if (initialUpdate.choices.length > 0) {
        const choiceUpdate = model.selectChoice(0);
        expect(choiceUpdate).toBeDefined();
        expect(choiceUpdate.events).toBeDefined();
      }
    });

    test("should reset story state", () => {
      // Continue story first
      model.continueStory();

      // Reset
      model.reset();

      // Should be able to continue again
      const update = model.continueStory();
      expect(update).toBeDefined();
    });

    test("should detect story end", () => {
      const model = new PreviewModel(
        createMockSuccessfulBuildResult("/test/simple.ink", true)
      );
      model.onError(errorCallback);

      const update = model.continueStory();
      expect(update.hasEnded).toBe(true);
    });
  });

  describe("Error Message Parsing", () => {
    test("should parse RUNTIME ERROR with file path", () => {
      const testError = new Error(
        "RUNTIME ERROR: '/project/test.ink' line 20: unexpectedly reached end of content. Do you need a '->->' to return from a tunnel?"
      );

      // Access private method via type assertion
      const parseMethod = (model as any).parseErrorMessage.bind(model);
      const result = parseMethod(testError.message);

      expect(result.severity).toBe("error");
      expect(result.message).toBe(
        "'/project/test.ink' line 20: unexpectedly reached end of content. Do you need a '->->' to return from a tunnel?"
      );
    });

    test("should parse RUNTIME WARNING with file path", () => {
      const testError = new Error(
        "RUNTIME WARNING: '/project/test.ink' line 20: unexpectedly reached end of content. Do you need a '->->' to return from a tunnel?"
      );

      const parseMethod = (model as any).parseErrorMessage.bind(model);
      const result = parseMethod(testError.message);

      expect(result.severity).toBe("warning");
      expect(result.message).toBe(
        "'/project/test.ink' line 20: unexpectedly reached end of content. Do you need a '->->' to return from a tunnel?"
      );
    });

    test("should parse RUNTIME ERROR with pointer", () => {
      const testError = new Error(
        "RUNTIME ERROR: (pointer 1234): unexpectedly reached end of content. Do you need a '->->' to return from a tunnel?"
      );

      const parseMethod = (model as any).parseErrorMessage.bind(model);
      const result = parseMethod(testError.message);

      expect(result.severity).toBe("error");
      expect(result.message).toBe(
        "(pointer 1234): unexpectedly reached end of content. Do you need a '->->' to return from a tunnel?"
      );
    });

    test("should parse Error with external function", () => {
      const testError = new Error(
        "Error: Missing function binding for external: 'testmethod' (ink fallbacks disabled)"
      );

      const parseMethod = (model as any).parseErrorMessage.bind(model);
      const result = parseMethod(testError.message);

      expect(result.severity).toBe("error");
      expect(result.message).toBe(
        "Missing function binding for external: 'testmethod' (ink fallbacks disabled)"
      );
    });

    test("should handle messages with fewer than 2 colons", () => {
      const testError = new Error("Simple error message");

      const parseMethod = (model as any).parseErrorMessage.bind(model);
      const result = parseMethod(testError.message);

      expect(result.severity).toBe(null);
      expect(result.message).toBe("Simple error message");
    });

    test("should handle messages with only one colon", () => {
      const testError = new Error("Error: Simple error message");

      const parseMethod = (model as any).parseErrorMessage.bind(model);
      const result = parseMethod(testError.message);

      expect(result.severity).toBe("error");
      expect(result.message).toBe("Simple error message");
    });

    test("should handle Warning prefix", () => {
      const testError = new Error(
        "Warning: Some warning message: with details"
      );

      const parseMethod = (model as any).parseErrorMessage.bind(model);
      const result = parseMethod(testError.message);

      expect(result.severity).toBe("warning");
      expect(result.message).toBe("Some warning message: with details");
    });
  });

  describe("Error Handling Integration", () => {
    test("should call error callback with parsed severity and message", () => {
      const testError = new Error(
        "RUNTIME ERROR: '/path/to/file.ink' line 5: some error message"
      );

      // Access private method via type assertion
      const handleErrorMethod = (model as any).handleError.bind(model);
      handleErrorMethod(testError);

      expect(errorCallback).toHaveBeenCalledWith(
        "'/path/to/file.ink' line 5: some error message",
        "error"
      );
    });

    test("should use fallback severity when no severity is parsed", () => {
      const testError = new Error("Some generic error");

      const handleErrorMethod = (model as any).handleError.bind(model);
      handleErrorMethod(testError, "Fallback message", "warning");

      expect(errorCallback).toHaveBeenCalledWith(
        "Some generic error",
        "warning"
      );
    });

    test("should override fallback severity with parsed severity", () => {
      const testError = new Error(
        "RUNTIME WARNING: file.ink line 1: warning message"
      );

      const handleErrorMethod = (model as any).handleError.bind(model);
      handleErrorMethod(testError, "Fallback message", "error");

      expect(errorCallback).toHaveBeenCalledWith(
        "file.ink line 1: warning message",
        "warning"
      );
    });
  });
});
