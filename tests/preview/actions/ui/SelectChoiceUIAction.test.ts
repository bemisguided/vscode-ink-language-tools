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

import { SelectChoiceUIAction } from "../../../../src/preview/actions/ui/SelectChoiceUIAction";
import { SelectChoiceAction } from "../../../../src/preview/actions/story/SelectChoiceAction";
import { UIActionContext } from "../../../../src/preview/UIActionContext";
import { mockUIActionContext } from "../../../__mocks__/mockUIActionContext";

describe("SelectChoiceUIAction", () => {
  let mockContext: UIActionContext;

  beforeEach(() => {
    mockContext = mockUIActionContext();
  });

  describe("constructor", () => {
    test("should create instance with correct properties and payload", () => {
      // Set up
      const payload = { choiceIndex: 2 };

      // Execute
      const action = new SelectChoiceUIAction(payload);

      // Assert
      expect(action.category).toBe("ui");
      expect(action.type).toBe("SELECT_CHOICE");
      expect(action.type).toBe(SelectChoiceUIAction.typeId);
      expect(action.payload).toEqual(payload);
    });

    test("should store payload reference correctly", () => {
      // Set up
      const payload = { choiceIndex: 5 };

      // Execute
      const action = new SelectChoiceUIAction(payload);

      // Assert
      expect(action.payload.choiceIndex).toBe(5);
    });

    test("should handle zero choice index", () => {
      // Set up
      const payload = { choiceIndex: 0 };

      // Execute
      const action = new SelectChoiceUIAction(payload);

      // Assert
      expect(action.payload.choiceIndex).toBe(0);
    });

    test("should handle large choice index", () => {
      // Set up
      const payload = { choiceIndex: 999 };

      // Execute
      const action = new SelectChoiceUIAction(payload);

      // Assert
      expect(action.payload.choiceIndex).toBe(999);
    });
  });

  describe("apply", () => {
    test("should dispatch SelectChoiceAction with correct choice index", () => {
      // Set up
      const payload = { choiceIndex: 3 };
      const action = new SelectChoiceUIAction(payload);
      const mockDispatch = jest.fn();
      mockContext.dispatch = mockDispatch;

      // Execute
      action.apply(mockContext);

      // Assert
      expect(mockDispatch).toHaveBeenCalledTimes(1);
      expect(mockDispatch).toHaveBeenCalledWith(expect.any(SelectChoiceAction));
    });

    test("should send story state to webview", () => {
      // Set up
      const payload = { choiceIndex: 1 };
      const action = new SelectChoiceUIAction(payload);
      const mockSendStoryState = jest.fn();
      mockContext.sendStoryState = mockSendStoryState;

      // Execute
      action.apply(mockContext);

      // Assert
      expect(mockSendStoryState).toHaveBeenCalledTimes(1);
    });

    test("should send story state after dispatching action", () => {
      // Set up
      const payload = { choiceIndex: 2 };
      const action = new SelectChoiceUIAction(payload);
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
      expect(callOrder).toEqual(["dispatch", "sendStoryState"]);
    });

    test("should handle choice index zero", () => {
      // Set up
      const payload = { choiceIndex: 0 };
      const action = new SelectChoiceUIAction(payload);
      const mockDispatch = jest.fn();
      mockContext.dispatch = mockDispatch;

      // Execute
      action.apply(mockContext);

      // Assert
      expect(mockDispatch).toHaveBeenCalledTimes(1);
      expect(mockDispatch).toHaveBeenCalledWith(expect.any(SelectChoiceAction));
    });

    test("should handle large choice index", () => {
      // Set up
      const payload = { choiceIndex: 100 };
      const action = new SelectChoiceUIAction(payload);
      const mockDispatch = jest.fn();
      mockContext.dispatch = mockDispatch;

      // Execute
      action.apply(mockContext);

      // Assert
      expect(mockDispatch).toHaveBeenCalledTimes(1);
      expect(mockDispatch).toHaveBeenCalledWith(expect.any(SelectChoiceAction));
    });

    test("should handle context with all required methods", () => {
      // Set up
      const payload = { choiceIndex: 1 };
      const action = new SelectChoiceUIAction(payload);

      // Execute & Assert
      expect(() => action.apply(mockContext)).not.toThrow();
    });
  });
});
