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

import { RewindStoryUIAction } from "../../../../src/preview/actions/ui/RewindStoryUIAction";
import { UIActionContext } from "../../../../src/preview/UIActionContext";
import { mockUIActionContext } from "../../../__mocks__/mockUIActionContext";

describe("RewindStoryUIAction", () => {
  let action: RewindStoryUIAction;
  let mockContext: UIActionContext;

  beforeEach(() => {
    action = new RewindStoryUIAction();
    mockContext = mockUIActionContext();
  });

  describe("constructor", () => {
    test("should create instance with correct properties", () => {
      // Set up
      // (Done in beforeEach)

      // Execute
      const newAction = new RewindStoryUIAction();

      // Assert
      expect(newAction.category).toBe("ui");
      expect(newAction.type).toBe("REWIND_STORY");
      expect(newAction.type).toBe(RewindStoryUIAction.typeId);
    });
  });

  describe("apply", () => {
    test("should call rewindStoryToLastChoice on context", () => {
      // Set up
      const mockRewindStoryToLastChoice = jest.fn();
      mockContext.rewindStoryToLastChoice = mockRewindStoryToLastChoice;

      // Execute
      action.apply(mockContext);

      // Assert
      expect(mockRewindStoryToLastChoice).toHaveBeenCalledTimes(1);
    });

    test("should send story state to webview", () => {
      // Set up
      const mockSendStoryState = jest.fn();
      mockContext.sendStoryState = mockSendStoryState;

      // Execute
      action.apply(mockContext);

      // Assert
      expect(mockSendStoryState).toHaveBeenCalledTimes(1);
    });

    test("should send story state after rewinding", () => {
      // Set up
      const callOrder: string[] = [];
      const mockRewindStoryToLastChoice = jest.fn(() =>
        callOrder.push("rewind")
      );
      const mockSendStoryState = jest.fn(() =>
        callOrder.push("sendStoryState")
      );
      mockContext.rewindStoryToLastChoice = mockRewindStoryToLastChoice;
      mockContext.sendStoryState = mockSendStoryState;

      // Execute
      action.apply(mockContext);

      // Assert
      expect(callOrder).toEqual(["rewind", "sendStoryState"]);
    });

    test("should handle context with all required methods", () => {
      // Set up
      // (mockContext has all required methods)

      // Execute & Assert
      expect(() => action.apply(mockContext)).not.toThrow();
    });

    test("should work when rewindStoryToLastChoice is called multiple times", () => {
      // Set up
      const mockRewindStoryToLastChoice = jest.fn();
      mockContext.rewindStoryToLastChoice = mockRewindStoryToLastChoice;

      // Execute
      action.apply(mockContext);
      action.apply(mockContext);

      // Assert
      expect(mockRewindStoryToLastChoice).toHaveBeenCalledTimes(2);
    });

    test("should not dispatch any actions", () => {
      // Set up
      const mockDispatch = jest.fn();
      mockContext.dispatch = mockDispatch;

      // Execute
      action.apply(mockContext);

      // Assert
      expect(mockDispatch).not.toHaveBeenCalled();
    });

    test("should call rewindStoryToLastChoice before sendStoryState", () => {
      // Set up
      let rewindCalled = false;
      const mockRewindStoryToLastChoice = jest.fn(() => {
        rewindCalled = true;
      });
      const mockSendStoryState = jest.fn(() => {
        expect(rewindCalled).toBe(true);
      });
      mockContext.rewindStoryToLastChoice = mockRewindStoryToLastChoice;
      mockContext.sendStoryState = mockSendStoryState;

      // Execute
      action.apply(mockContext);

      // Assert
      expect(mockRewindStoryToLastChoice).toHaveBeenCalled();
      expect(mockSendStoryState).toHaveBeenCalled();
    });
  });
});
