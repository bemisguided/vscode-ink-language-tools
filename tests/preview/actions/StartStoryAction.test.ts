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

import {
  PreviewState,
  PreviewStoryState,
  StoryEvent,
  Choice,
  ErrorInfo,
} from "../../../src/preview/PreviewState";
import { StartStoryAction } from "../../../src/preview/actions/StartStoryAction";
import { PreviewActionContext } from "../../../src/preview/PreviewActionContext";
import { mockPreviewActionContext } from "../../__mocks__/mockPreviewActionContext";
import {
  mockPreviewState,
  mockPreviewStoryState,
} from "../../__mocks__/mockPreviewState";
import { SetCurrentChoicesAction } from "../../../src/preview/actions/SetCurrentChoicesAction";
import { AddStoryEventsAction } from "../../../src/preview/actions/AddStoryEventsAction";
import { AddErrorsAction } from "../../../src/preview/actions/AddErrorsAction";
import { EndStoryAction } from "../../../src/preview/actions/EndStoryAction";
import { StoryProgressResult } from "../../../src/preview/StoryProgressResult";

describe("StartStoryAction", () => {
  function setupState(
    story: PreviewStoryState = mockPreviewStoryState()
  ): PreviewState {
    return {
      ...mockPreviewState(),
      story,
    };
  }
  let mockContext: PreviewActionContext;

  beforeEach(() => {
    mockContext = mockPreviewActionContext();
  });

  describe("apply()", () => {
    test("should reset all story state properties", () => {
      // Setup
      const action = new StartStoryAction();
      const currentState = setupState({
        ...mockPreviewStoryState(),
        events: [{ type: "text", text: "Previous text", tags: [] }],
        choices: [{ index: 0, text: "Previous choice", tags: [] }],
        errors: [{ message: "Previous error", severity: "error" }],
        isEnded: true,
        lastChoiceIndex: 5,
        isStart: false,
      });
      currentState.ui.canRewind = true;

      // Execute
      const newState = action.apply(currentState);

      // Assert
      expect(newState.story.events).toEqual([]);
      expect(newState.story.choices).toEqual([]);
      expect(newState.story.errors).toEqual([]);
      expect(newState.story.isEnded).toBe(false);
      expect(newState.story.lastChoiceIndex).toBe(0);
      expect(newState.story.isStart).toBe(true);
      expect(newState.ui.canRewind).toBe(false);
    });
  });

  describe("effect()", () => {
    test("should reset story manager and call continue", () => {
      // Setup
      const action = new StartStoryAction();
      const context = mockPreviewActionContext();

      // Execute
      action.effect(context);

      // Assert
      expect(context.storyManager.reset).toHaveBeenCalled();
      expect(context.storyManager.continue).toHaveBeenCalled();
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
      const action = new StartStoryAction();
      const context = mockPreviewActionContext();
      context.storyManager.continue = jest.fn().mockReturnValue(result);

      // Execute
      action.effect(context);

      // Assert
      expect(context.dispatch).toHaveBeenCalledWith(
        new SetCurrentChoicesAction(choices)
      );
    });

    test("should dispatch AddStoryEventsAction when events present", () => {
      // Setup
      const events: StoryEvent[] = [
        { type: "text", text: "Story begins", tags: [] },
      ];
      const result: StoryProgressResult = {
        events,
        choices: [],
        isEnded: false,
        errors: [],
      };
      const action = new StartStoryAction();
      const context = mockPreviewActionContext();
      context.storyManager.continue = jest.fn().mockReturnValue(result);

      // Execute
      action.effect(context);

      // Assert
      expect(context.dispatch).toHaveBeenCalledWith(
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
      const action = new StartStoryAction();
      const context = mockPreviewActionContext();
      context.storyManager.continue = jest.fn().mockReturnValue(result);

      // Execute
      action.effect(context);

      // Assert
      expect(context.dispatch).toHaveBeenCalledWith(
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
      const action = new StartStoryAction();
      const context = mockPreviewActionContext();
      context.storyManager.continue = jest.fn().mockReturnValue(result);

      // Execute
      action.effect(context);

      // Assert
      expect(context.dispatch).toHaveBeenCalledWith(new EndStoryAction());
    });

    test("should handle empty events array", () => {
      // Setup
      const result: StoryProgressResult = {
        events: [],
        choices: [{ index: 0, text: "Choice", tags: [] }],
        isEnded: false,
        errors: [],
      };
      const action = new StartStoryAction();
      const context = mockPreviewActionContext();
      context.storyManager.continue = jest.fn().mockReturnValue(result);

      // Execute
      action.effect(context);

      // Assert
      expect(context.dispatch).toHaveBeenCalledTimes(1);
      expect(context.dispatch).toHaveBeenCalledWith(
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
      const action = new StartStoryAction();
      const context = mockPreviewActionContext();
      context.storyManager.continue = jest.fn().mockReturnValue(result);

      // Execute
      action.effect(context);

      // Assert
      expect(context.dispatch).toHaveBeenCalledTimes(2);
      expect(context.dispatch).toHaveBeenCalledWith(
        new AddStoryEventsAction(result.events)
      );
      expect(context.dispatch).toHaveBeenCalledWith(
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
      const action = new StartStoryAction();
      const context = mockPreviewActionContext();
      context.storyManager.continue = jest.fn().mockReturnValue(result);

      // Execute
      action.effect(context);

      // Assert
      expect(context.dispatch).toHaveBeenCalledTimes(4);
      expect(context.dispatch).toHaveBeenCalledWith(
        new AddErrorsAction(errors)
      );
      expect(context.dispatch).toHaveBeenCalledWith(
        new AddStoryEventsAction(events)
      );
      expect(context.dispatch).toHaveBeenCalledWith(
        new SetCurrentChoicesAction(choices)
      );
      expect(context.dispatch).toHaveBeenCalledWith(new EndStoryAction());
    });
  });
});
