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

import { SelectChoiceAction } from "../../../src/preview/actions/SelectChoiceAction";
import {
  PreviewState,
  PreviewStoryState,
  StoryEvent,
  Choice,
  ErrorInfo,
} from "../../../src/preview/PreviewState";
import {
  mockPreviewState,
  mockPreviewStoryState,
} from "../../__mocks__/mockPreviewState";
import { mockPreviewActionContext } from "../../__mocks__/mockPreviewActionContext";
import { PreviewActionContext } from "../../../src/preview/PreviewActionContext";
import { AddStoryEventsAction } from "../../../src/preview/actions/AddStoryEventsAction";
import { SetCurrentChoicesAction } from "../../../src/preview/actions/SetCurrentChoicesAction";
import { EndStoryAction } from "../../../src/preview/actions/EndStoryAction";
import { AddErrorsAction } from "../../../src/preview/actions/AddErrorsAction";
import { StoryProgressResult } from "../../../src/preview/StoryProgressResult";

describe("SelectChoiceAction", () => {
  function setupState(
    story: PreviewStoryState = mockPreviewStoryState()
  ): PreviewState {
    return {
      ...mockPreviewState(),
      story,
    };
  }

  describe("apply()", () => {
    test("should set story.isStart to false", () => {
      // Setup
      const action = new SelectChoiceAction(0);
      const currentState = setupState({
        ...mockPreviewStoryState(),
        isStart: true,
      });

      // Execute
      const newState = action.apply(currentState);

      // Assert
      expect(newState.story.isStart).toBe(false);
    });

    test("should set ui.canRewind to true", () => {
      // Setup
      const action = new SelectChoiceAction(0);
      const currentState = setupState();
      currentState.ui.canRewind = false;

      // Execute
      const newState = action.apply(currentState);

      // Assert
      expect(newState.ui.canRewind).toBe(true);
    });
  });

  describe("effect()", () => {
    let mockContext: PreviewActionContext;

    beforeEach(() => {
      mockContext = mockPreviewActionContext();
    });

    test("should call storyManager.selectChoice with correct index", () => {
      // Setup
      const choiceIndex = 2;
      const action = new SelectChoiceAction(choiceIndex);
      mockContext.storyManager.getCurrentChoices = jest.fn().mockReturnValue([
        { index: 0, text: "Choice 1", tags: [] },
        { index: 1, text: "Choice 2", tags: [] },
        { index: 2, text: "Choice 3", tags: [] },
      ]);

      // Execute
      action.effect(mockContext);

      // Assert
      expect(mockContext.storyManager.selectChoice).toHaveBeenCalledWith(
        choiceIndex
      );
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
      const action = new SelectChoiceAction(0);
      mockContext.storyManager.getCurrentChoices = jest
        .fn()
        .mockReturnValue([{ index: 0, text: "Available choice", tags: [] }]);
      mockContext.storyManager.selectChoice = jest.fn().mockReturnValue(result);

      // Execute
      action.effect(mockContext);

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
      const action = new SelectChoiceAction(0);
      mockContext.storyManager.getCurrentChoices = jest
        .fn()
        .mockReturnValue([{ index: 0, text: "Available choice", tags: [] }]);
      mockContext.storyManager.selectChoice = jest.fn().mockReturnValue(result);

      // Execute
      action.effect(mockContext);

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
      const action = new SelectChoiceAction(0);
      mockContext.storyManager.getCurrentChoices = jest
        .fn()
        .mockReturnValue([{ index: 0, text: "Available choice", tags: [] }]);
      mockContext.storyManager.selectChoice = jest.fn().mockReturnValue(result);

      // Execute
      action.effect(mockContext);

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
      const action = new SelectChoiceAction(0);
      mockContext.storyManager.getCurrentChoices = jest
        .fn()
        .mockReturnValue([{ index: 0, text: "Available choice", tags: [] }]);
      mockContext.storyManager.selectChoice = jest.fn().mockReturnValue(result);

      // Execute
      action.effect(mockContext);

      // Assert
      expect(mockContext.dispatch).toHaveBeenCalledWith(new EndStoryAction());
    });

    test("should handle choice index out of bounds", () => {
      // Setup
      const choiceIndex = 5;
      const availableChoices: Choice[] = [
        { index: 0, text: "Choice 1", tags: [] },
        { index: 1, text: "Choice 2", tags: [] },
      ];
      const action = new SelectChoiceAction(choiceIndex);
      mockContext.storyManager.getCurrentChoices = jest
        .fn()
        .mockReturnValue(availableChoices);

      // Execute
      action.effect(mockContext);

      // Assert
      expect(mockContext.dispatch).toHaveBeenCalledWith(
        new AddErrorsAction([
          {
            message:
              "The choice that was originally selected, is no longer available after live refreshing the story.  The story has rewound to where the choice was originally selected.",
            severity: "info",
          },
        ])
      );
      expect(mockContext.storyManager.selectChoice).not.toHaveBeenCalled();
    });

    test("should handle empty events array", () => {
      // Setup
      const result: StoryProgressResult = {
        events: [],
        choices: [{ index: 0, text: "Choice", tags: [] }],
        isEnded: false,
        errors: [],
      };
      const action = new SelectChoiceAction(0);
      mockContext.storyManager.getCurrentChoices = jest
        .fn()
        .mockReturnValue([{ index: 0, text: "Available choice", tags: [] }]);
      mockContext.storyManager.selectChoice = jest.fn().mockReturnValue(result);

      // Execute
      action.effect(mockContext);

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
      const action = new SelectChoiceAction(0);
      mockContext.storyManager.getCurrentChoices = jest
        .fn()
        .mockReturnValue([{ index: 0, text: "Available choice", tags: [] }]);
      mockContext.storyManager.selectChoice = jest.fn().mockReturnValue(result);

      // Execute
      action.effect(mockContext);

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
      const action = new SelectChoiceAction(1);
      mockContext.storyManager.getCurrentChoices = jest.fn().mockReturnValue([
        { index: 0, text: "Choice 1", tags: [] },
        { index: 1, text: "Choice 2", tags: [] },
      ]);
      mockContext.storyManager.selectChoice = jest.fn().mockReturnValue(result);

      // Execute
      action.effect(mockContext);

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
