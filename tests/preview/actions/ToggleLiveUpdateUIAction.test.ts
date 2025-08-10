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

import { ToggleLiveUpdateUIAction } from "../../../src/preview/actions/ToggleLiveUpdateUIAction";
import { PreviewActionContext } from "../../../src/preview/PreviewActionContext";
import { mockPreviewActionContext } from "../../__mocks__/mockPreviewActionContext";
import {
  mockPreviewState,
  mockPreviewUIState,
} from "../../__mocks__/mockPreviewState";

describe("ToggleLiveUpdateUIAction", () => {
  let context: PreviewActionContext;

  beforeEach(() => {
    // Setup: Create mock action context
    context = mockPreviewActionContext();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe(".constructor()", () => {
    test("should initialize with enabled state true", () => {
      // Setup
      const enabled = true;

      // Execute
      const action = new ToggleLiveUpdateUIAction(enabled);

      // Assert
      expect(action.type).toBe(ToggleLiveUpdateUIAction.actionType);
      expect(action.cursor).toBe(false);
    });

    test("should initialize with enabled state false", () => {
      // Setup
      const enabled = false;

      // Execute
      const action = new ToggleLiveUpdateUIAction(enabled);

      // Assert
      expect(action.type).toBe(ToggleLiveUpdateUIAction.actionType);
      expect(action.cursor).toBe(false);
    });
  });

  describe(".apply()", () => {
    describe("when enabled is true", () => {
      test("should set liveUpdateEnabled to true in UI state", () => {
        // Setup
        const action = new ToggleLiveUpdateUIAction(true);
        const state = mockPreviewState({}, { liveUpdateEnabled: false });

        // Execute
        const result = action.apply(state);

        // Assert
        expect(result.ui.liveUpdateEnabled).toBe(true);
        expect(result.ui.canRewind).toBe(false); // Other UI state preserved
      });

      test("should preserve other UI state properties", () => {
        // Setup
        const action = new ToggleLiveUpdateUIAction(true);
        const state = mockPreviewState({}, { canRewind: true, liveUpdateEnabled: false });

        // Execute
        const result = action.apply(state);

        // Assert
        expect(result.ui.liveUpdateEnabled).toBe(true);
        expect(result.ui.canRewind).toBe(true);
      });

      test("should preserve story state", () => {
        // Setup
        const action = new ToggleLiveUpdateUIAction(true);
        const state = mockPreviewState({ isEnded: true, lastChoiceIndex: 5 });

        // Execute
        const result = action.apply(state);

        // Assert
        expect(result.story.isEnded).toBe(true);
        expect(result.story.lastChoiceIndex).toBe(5);
        expect(result.ui.liveUpdateEnabled).toBe(true);
      });
    });

    describe("when enabled is false", () => {
      test("should set liveUpdateEnabled to false in UI state", () => {
        // Setup
        const action = new ToggleLiveUpdateUIAction(false);
        const state = mockPreviewState({}, { liveUpdateEnabled: true });

        // Execute
        const result = action.apply(state);

        // Assert
        expect(result.ui.liveUpdateEnabled).toBe(false);
      });

      test("should preserve other UI state properties", () => {
        // Setup
        const action = new ToggleLiveUpdateUIAction(false);
        const state = mockPreviewState({}, { canRewind: true, liveUpdateEnabled: true });

        // Execute
        const result = action.apply(state);

        // Assert
        expect(result.ui.liveUpdateEnabled).toBe(false);
        expect(result.ui.canRewind).toBe(true);
      });
    });
  });

  describe(".effect()", () => {
    test("should perform no side effects when enabled is true", () => {
      // Setup
      const action = new ToggleLiveUpdateUIAction(true);

      // Execute
      action.effect(context);

      // Assert
      expect(context.dispatch).not.toHaveBeenCalled();
      expect(context.cancel).not.toHaveBeenCalled();
      expect(context.undo).not.toHaveBeenCalled();
    });

    test("should perform no side effects when enabled is false", () => {
      // Setup
      const action = new ToggleLiveUpdateUIAction(false);

      // Execute
      action.effect(context);

      // Assert
      expect(context.dispatch).not.toHaveBeenCalled();
      expect(context.cancel).not.toHaveBeenCalled();
      expect(context.undo).not.toHaveBeenCalled();
    });
  });

  describe("Static Properties", () => {
    test("should have correct actionType constant", () => {
      // Execute & Assert
      expect(ToggleLiveUpdateUIAction.actionType).toBe("TOGGLE_LIVE_UPDATE");
    });
  });

  describe("Instance Properties", () => {
    test("should have cursor set to false for non-historical action", () => {
      // Setup
      const action = new ToggleLiveUpdateUIAction(true);

      // Execute & Assert
      expect(action.cursor).toBe(false);
    });

    test("should have type matching static actionType constant", () => {
      // Setup
      const action = new ToggleLiveUpdateUIAction(true);

      // Execute & Assert
      expect(action.type).toBe(ToggleLiveUpdateUIAction.actionType);
    });
  });
});