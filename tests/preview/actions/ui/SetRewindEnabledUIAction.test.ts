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

import { SetRewindEnabledUIAction } from "../../../../src/preview/actions/ui/SetRewindEnabledUIAction";
import { mockUIState } from "../../../__mocks__/mockUIState";

describe("SetRewindEnabledUIAction", () => {
  describe("constructor", () => {
    test("should set enabled property correctly when true", () => {
      // Setup
      const enabled = true;

      // Execute
      const action = new SetRewindEnabledUIAction(enabled);

      // Assert
      expect(action.category).toBe("ui");
      expect(action.type).toBe("SET_REWIND_ENABLED");
      expect(action.type).toBe(SetRewindEnabledUIAction.typeId);
    });

    test("should set enabled property correctly when false", () => {
      // Setup
      const enabled = false;

      // Execute
      const action = new SetRewindEnabledUIAction(enabled);

      // Assert
      expect(action.category).toBe("ui");
      expect(action.type).toBe("SET_REWIND_ENABLED");
      expect(action.type).toBe(SetRewindEnabledUIAction.typeId);
    });
  });

  describe("reduce", () => {
    test("should set rewind to true when enabled is true", () => {
      // Setup
      const initialState = mockUIState({ rewind: false });
      const action = new SetRewindEnabledUIAction(true);

      // Execute
      const newState = action.reduce(initialState);

      // Assert
      expect(newState.rewind).toBe(true);
    });

    test("should set rewind to false when enabled is false", () => {
      // Setup
      const initialState = mockUIState({ rewind: true });
      const action = new SetRewindEnabledUIAction(false);

      // Execute
      const newState = action.reduce(initialState);

      // Assert
      expect(newState.rewind).toBe(false);
    });

    test("should preserve other UI state properties", () => {
      // Setup
      const initialState = mockUIState({ rewind: false });
      const action = new SetRewindEnabledUIAction(true);

      // Execute
      const newState = action.reduce(initialState);

      // Assert
      expect(newState).toEqual({ rewind: true });
      expect(newState).not.toBe(initialState); // Should be a new object
    });

    test("should not mutate the input state", () => {
      // Setup
      const initialState = mockUIState({ rewind: false });
      const action = new SetRewindEnabledUIAction(true);

      // Execute
      const newState = action.reduce(initialState);

      // Assert
      expect(initialState.rewind).toBe(false); // Original state unchanged
      expect(newState.rewind).toBe(true); // New state has the change
      expect(newState).not.toBe(initialState); // Different object references
    });

    test("should handle toggling from true to false", () => {
      // Setup
      const initialState = mockUIState({ rewind: true });
      const action = new SetRewindEnabledUIAction(false);

      // Execute
      const newState = action.reduce(initialState);

      // Assert
      expect(newState.rewind).toBe(false);
    });

    test("should handle setting same value", () => {
      // Setup
      const initialState = mockUIState({ rewind: true });
      const action = new SetRewindEnabledUIAction(true);

      // Execute
      const newState = action.reduce(initialState);

      // Assert
      expect(newState.rewind).toBe(true);
      expect(newState).not.toBe(initialState); // Should still create new object
    });
  });
});
