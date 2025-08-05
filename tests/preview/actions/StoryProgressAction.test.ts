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

import { StoryProgressAction } from "../../../src/preview/actions/StoryProgressAction";
import { PreviewActionContext } from "../../../src/preview/PreviewActionContext";
import { mockPreviewActionContext } from "../../__mocks__/mockPreviewActionContext";
import { AddStoryEventsAction } from "../../../src/preview/actions/AddStoryEventsAction";
import { SetCurrentChoicesAction } from "../../../src/preview/actions/SetCurrentChoicesAction";
import { EndStoryAction } from "../../../src/preview/actions/EndStoryAction";
import { AddErrorsAction } from "../../../src/preview/actions/AddErrorsAction";
import { StoryProgressResult } from "../../../src/preview/StoryProgressResult";
import {
  StoryEvent,
  Choice,
  ErrorInfo,
  PreviewState,
} from "../../../src/preview/PreviewState";

// Test implementation of StoryProgressAction for testing protected methods
class TestStoryProgressAction extends StoryProgressAction {
  public readonly type = "TEST_STORY_PROGRESS";
  public readonly cursor = true;

  public apply(state: PreviewState): PreviewState {
    return state;
  }

  public effect(context: PreviewActionContext): void {
    // Test implementation - no-op
  }

  // Expose protected method for testing
  public testApplyStoryProgress(
    result: StoryProgressResult,
    context: PreviewActionContext
  ): void {
    this.applyStoryProgress(result, context);
  }
}

describe("StoryProgressAction", () => {
  describe("applyStoryProgress()", () => {
    let mockContext: PreviewActionContext;
    let action: TestStoryProgressAction;

    beforeEach(() => {
      mockContext = mockPreviewActionContext();
      action = new TestStoryProgressAction();
    });

    test("should dispatch SetCurrentChoicesAction with result choices", () => {
      // Setup
      const choices: Choice[] = [
        { index: 0, text: "New choice", tags: ["test"] },
      ];
      const result: StoryProgressResult = {
        events: [],
        choices,
        isEnded: false,
        errors: [],
      };

      // Execute
      action.testApplyStoryProgress(result, mockContext);

      // Assert
      expect(mockContext.dispatch).toHaveBeenCalledWith(
        new SetCurrentChoicesAction(choices)
      );
    });

    test("should dispatch AddStoryEventsAction when events present", () => {
      // Setup
      const events: StoryEvent[] = [
        { type: "text", text: "Story continues", tags: [] },
      ];
      const result: StoryProgressResult = {
        events,
        choices: [],
        isEnded: false,
        errors: [],
      };

      // Execute
      action.testApplyStoryProgress(result, mockContext);

      // Assert
      expect(mockContext.dispatch).toHaveBeenCalledWith(
        new AddStoryEventsAction(events)
      );
    });

    test("should dispatch AddErrorsAction when errors present", () => {
      // Setup
      const errors: ErrorInfo[] = [
        { message: "Story error", severity: "error" },
      ];
      const result: StoryProgressResult = {
        events: [],
        choices: [],
        isEnded: false,
        errors,
      };

      // Execute
      action.testApplyStoryProgress(result, mockContext);

      // Assert
      expect(mockContext.dispatch).toHaveBeenCalledWith(
        new AddErrorsAction(errors)
      );
    });

    test("should dispatch EndStoryAction when story ends", () => {
      // Setup
      const result: StoryProgressResult = {
        events: [],
        choices: [],
        isEnded: true,
        errors: [],
      };

      // Execute
      action.testApplyStoryProgress(result, mockContext);

      // Assert
      expect(mockContext.dispatch).toHaveBeenCalledWith(new EndStoryAction());
    });

    test("should handle empty events array", () => {
      // Setup
      const result: StoryProgressResult = {
        events: [],
        choices: [{ index: 0, text: "Choice", tags: [] }],
        isEnded: false,
        errors: [],
      };

      // Execute
      action.testApplyStoryProgress(result, mockContext);

      // Assert
      expect(mockContext.dispatch).toHaveBeenCalledTimes(1);
      expect(mockContext.dispatch).toHaveBeenCalledWith(
        new SetCurrentChoicesAction(result.choices)
      );
    });

    test("should handle empty errors array", () => {
      // Setup
      const result: StoryProgressResult = {
        events: [{ type: "text", text: "Story", tags: [] }],
        choices: [],
        isEnded: false,
        errors: [],
      };

      // Execute
      action.testApplyStoryProgress(result, mockContext);

      // Assert
      expect(mockContext.dispatch).toHaveBeenCalledTimes(2);
      expect(mockContext.dispatch).toHaveBeenCalledWith(
        new AddStoryEventsAction(result.events)
      );
      expect(mockContext.dispatch).toHaveBeenCalledWith(
        new SetCurrentChoicesAction(result.choices)
      );
    });

    test("should handle complete story progression with all dispatches", () => {
      // Setup
      const events: StoryEvent[] = [
        { type: "text", text: "Final story text", tags: ["ending"] },
      ];
      const errors: ErrorInfo[] = [
        { message: "Warning message", severity: "warning" },
      ];
      const choices: Choice[] = [
        { index: 0, text: "Final choice", tags: ["final"] },
      ];
      const result: StoryProgressResult = {
        events,
        choices,
        isEnded: true,
        errors,
      };

      // Execute
      action.testApplyStoryProgress(result, mockContext);

      // Assert
      expect(mockContext.dispatch).toHaveBeenCalledTimes(4);
      expect(mockContext.dispatch).toHaveBeenCalledWith(
        new AddErrorsAction(errors)
      );
      expect(mockContext.dispatch).toHaveBeenCalledWith(
        new AddStoryEventsAction(events)
      );
      expect(mockContext.dispatch).toHaveBeenCalledWith(
        new SetCurrentChoicesAction(choices)
      );
      expect(mockContext.dispatch).toHaveBeenCalledWith(new EndStoryAction());
    });
  });
});
