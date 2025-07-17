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
import { PreviewActionContext } from "../../../src/preview/PreviewAction";
import { mockPreviewState } from "../../__mocks__/mockPreviewState";

describe("InitializeStoryAction", () => {
  let mockContext: PreviewActionContext;
  let mockStory: any;

  beforeEach(() => {
    // Set up
    mockStory = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      ResetState: jest.fn(),
    };

    mockContext = {
      getState: jest.fn().mockReturnValue(mockPreviewState()),
      setState: jest.fn(),
      dispatch: jest.fn(),
      storyManager: {
        reset: jest.fn(),
        continue: jest.fn(),
        selectChoice: jest.fn(),
        isEnded: jest.fn(),
        canContinue: jest.fn(),
        getCurrentChoices: jest.fn(),
      } as any,
      story: mockStory,
    };
  });

  describe("apply", () => {
    test("should reset the story state when story is available", () => {
      // Set up
      const action = new InitializeStoryAction();

      // Execute
      action.apply(mockContext);

      // Assert
      expect(mockContext.storyManager.reset).toHaveBeenCalledTimes(1);
    });

    test("should call storyManager.reset() once", () => {
      // Set up
      const action = new InitializeStoryAction();

      // Execute
      action.apply(mockContext);

      // Assert
      expect(mockContext.storyManager.reset).toHaveBeenCalledTimes(1);
    });

    test("should not dispatch any actions", () => {
      // Set up
      const action = new InitializeStoryAction();

      // Execute
      action.apply(mockContext);

      // Assert
      expect(mockContext.dispatch).not.toHaveBeenCalled();
    });

    test("should not mutate state", () => {
      // Set up
      const action = new InitializeStoryAction();

      // Execute
      action.apply(mockContext);

      // Assert
      expect(mockContext.setState).not.toHaveBeenCalled();
    });
  });

  describe("type identification", () => {
    test("should have correct static type identifier", () => {
      // Assert
      expect(InitializeStoryAction.typeId).toBe("INITIALIZE_STORY");
    });

    test("should have correct instance type identifier", () => {
      // Set up
      const action = new InitializeStoryAction();

      // Assert
      expect(action.type).toBe("INITIALIZE_STORY");
      expect(action.type).toBe(InitializeStoryAction.typeId);
    });
  });

  describe("constructor", () => {
    test("should create action without parameters", () => {
      // Execute
      const action = new InitializeStoryAction();

      // Assert
      expect(action).toBeInstanceOf(InitializeStoryAction);
      expect(action.type).toBe("INITIALIZE_STORY");
    });
  });

  describe("integration", () => {
    test("should delegate reset operation to story manager", () => {
      // Set up
      const action = new InitializeStoryAction();

      // Execute
      action.apply(mockContext);

      // Assert
      expect(mockContext.storyManager.reset).toHaveBeenCalledTimes(1);
      // Error handling is now encapsulated in PreviewStoryManager
    });
  });
});
