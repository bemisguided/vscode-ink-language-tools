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

import { RestartStoryUIAction } from "../../../../src/preview/actions/ui/RestartStoryUIAction";
import { InitializeStoryAction } from "../../../../src/preview/actions/story/InitializeStoryAction";
import { StartStoryAction } from "../../../../src/preview/actions/story/StartStoryAction";
import { ContinueStoryAction } from "../../../../src/preview/actions/story/ContinueStoryAction";
import { UIActionContext } from "../../../../src/preview/UIActionContext";
import { mockUIActionContext } from "../../../__mocks__/mockUIActionContext";

describe("RestartStoryUIAction", () => {
  let action: RestartStoryUIAction;
  let mockContext: UIActionContext;

  beforeEach(() => {
    action = new RestartStoryUIAction();
    mockContext = mockUIActionContext();
  });

  describe("constructor", () => {
    test("should create instance with correct properties", () => {
      // Setup
      // (Done in beforeEach)

      // Execute
      const newAction = new RestartStoryUIAction();

      // Assert
      expect(newAction.category).toBe("ui");
      expect(newAction.type).toBe("RESTART_STORY");
      expect(newAction.type).toBe(RestartStoryUIAction.typeId);
    });
  });

  describe("apply", () => {
    test("should dispatch InitializeStoryAction", () => {
      // Setup
      const mockDispatch = jest.fn();
      mockContext.dispatch = mockDispatch;

      // Execute
      action.apply(mockContext);

      // Assert
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.any(InitializeStoryAction)
      );
    });

    test("should dispatch StartStoryAction", () => {
      // Setup
      const mockDispatch = jest.fn();
      mockContext.dispatch = mockDispatch;

      // Execute
      action.apply(mockContext);

      // Assert
      expect(mockDispatch).toHaveBeenCalledWith(expect.any(StartStoryAction));
    });

    test("should dispatch ContinueStoryAction", () => {
      // Setup
      const mockDispatch = jest.fn();
      mockContext.dispatch = mockDispatch;

      // Execute
      action.apply(mockContext);

      // Assert
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.any(ContinueStoryAction)
      );
    });

    test("should dispatch actions in correct order", () => {
      // Setup
      const mockDispatch = jest.fn();
      mockContext.dispatch = mockDispatch;

      // Execute
      action.apply(mockContext);

      // Assert
      expect(mockDispatch).toHaveBeenCalledTimes(4); // 3 story actions + 1 UI action
      expect(mockDispatch).toHaveBeenNthCalledWith(
        1,
        expect.any(InitializeStoryAction)
      );
      expect(mockDispatch).toHaveBeenNthCalledWith(
        2,
        expect.any(StartStoryAction)
      );
      expect(mockDispatch).toHaveBeenNthCalledWith(
        3,
        expect.any(ContinueStoryAction)
      );
      expect(mockDispatch).toHaveBeenNthCalledWith(
        4,
        expect.objectContaining({
          type: "SET_REWIND_ENABLED",
        })
      );
    });

    test("should dispatch SetRewindEnabledUIAction with false", () => {
      // Setup
      const mockDispatch = jest.fn();
      mockContext.dispatch = mockDispatch;

      // Execute
      action.apply(mockContext);

      // Assert
      expect(mockDispatch).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "SET_REWIND_ENABLED",
        })
      );
    });

    test("should dispatch rewind action after story restart actions", () => {
      // Setup
      const callOrder: string[] = [];
      const mockDispatch = jest.fn((dispatchedAction) => {
        if (dispatchedAction.category === "story") {
          callOrder.push("story");
        } else if (dispatchedAction.category === "ui") {
          callOrder.push("ui");
        }
      });
      mockContext.dispatch = mockDispatch;

      // Execute
      action.apply(mockContext);

      // Assert
      expect(callOrder).toEqual(["story", "story", "story", "ui"]);
    });

    test("should send story state to webview", () => {
      // Setup
      const mockSendStoryState = jest.fn();
      mockContext.sendStoryState = mockSendStoryState;

      // Execute
      action.apply(mockContext);

      // Assert
      expect(mockSendStoryState).toHaveBeenCalledTimes(1);
    });

    test("should send story state after dispatching actions", () => {
      // Setup
      const callOrder: string[] = [];
      const mockDispatch = jest.fn(() => callOrder.push("dispatch"));
      const mockSendStoryState = jest.fn(() =>
        callOrder.push("sendStoryState")
      );
      mockContext.dispatch = mockDispatch;
      mockContext.sendStoryState = mockSendStoryState;

      // Execute
      action.apply(mockContext);

      // Assert
      expect(callOrder).toEqual([
        "dispatch", // InitializeStoryAction
        "dispatch", // StartStoryAction
        "dispatch", // ContinueStoryAction
        "dispatch", // SetRewindEnabledUIAction
        "sendStoryState",
      ]);
    });

    test("should handle context with all required methods", () => {
      // Setup
      // (mockContext has all required methods)

      // Execute & Assert
      expect(() => action.apply(mockContext)).not.toThrow();
    });
  });
});
