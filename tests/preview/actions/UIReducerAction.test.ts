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

import { UIReducerAction } from "../../../src/preview/actions/UIReducerAction";
import { UIState } from "../../../src/preview/UIState";
import { UIActionContext } from "../../../src/preview/UIActionContext";
import { mockUIActionContext } from "../../__mocks__/mockUIActionContext";
import { mockUIState } from "../../__mocks__/mockUIState";

// Test implementation of abstract UIReducerAction for testing purposes
class TestUIReducerAction extends UIReducerAction {
  public static readonly typeId = "TEST_UI_REDUCER";
  public readonly type = TestUIReducerAction.typeId;

  private readonly newRewindValue: boolean;

  constructor(newRewindValue: boolean) {
    super();
    this.newRewindValue = newRewindValue;
  }

  reduce(state: UIState): UIState {
    return {
      ...state,
      rewind: this.newRewindValue,
    };
  }
}

describe("UIReducerAction", () => {
  let mockContext: UIActionContext;

  beforeEach(() => {
    mockContext = mockUIActionContext();
  });

  describe("apply", () => {
    test("should call reduce and update UI state through context", () => {
      // Setup
      const initialState = mockUIState({ rewind: false });
      const expectedNewState = mockUIState({ rewind: true });
      const action = new TestUIReducerAction(true);
      const mockGetState = jest.fn().mockReturnValue(initialState);
      const mockSetState = jest.fn();
      mockContext.getState = mockGetState;
      mockContext.setState = mockSetState;

      // Execute
      action.apply(mockContext);

      // Assert
      expect(mockGetState).toHaveBeenCalledTimes(1);
      expect(mockSetState).toHaveBeenCalledTimes(1);
      expect(mockSetState).toHaveBeenCalledWith(expectedNewState);
    });

    test("should pass current state to reduce method", () => {
      // Setup
      const initialState = mockUIState({ rewind: false });
      const action = new TestUIReducerAction(true);
      const mockGetState = jest.fn().mockReturnValue(initialState);
      const reduceSpy = jest.spyOn(action, "reduce");
      mockContext.getState = mockGetState;

      // Execute
      action.apply(mockContext);

      // Assert
      expect(reduceSpy).toHaveBeenCalledTimes(1);
      expect(reduceSpy).toHaveBeenCalledWith(initialState);
    });

    test("should preserve state properties not modified by reduce", () => {
      // Setup
      const initialState = mockUIState({ rewind: false });
      const action = new TestUIReducerAction(true);
      const mockSetState = jest.fn();
      mockContext.getState = jest.fn().mockReturnValue(initialState);
      mockContext.setState = mockSetState;

      // Execute
      action.apply(mockContext);

      // Assert
      const newState = mockSetState.mock.calls[0][0];
      expect(newState).toEqual({ rewind: true });
    });

    test("should call setState with result from reduce method", () => {
      // Setup
      const initialState = mockUIState({ rewind: false });
      const expectedState = mockUIState({ rewind: true });
      const action = new TestUIReducerAction(true);
      const mockSetState = jest.fn();
      mockContext.getState = jest.fn().mockReturnValue(initialState);
      mockContext.setState = mockSetState;

      // Execute
      action.apply(mockContext);

      // Assert
      expect(mockSetState).toHaveBeenCalledWith(expectedState);
    });
  });
});
