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
  });
});
