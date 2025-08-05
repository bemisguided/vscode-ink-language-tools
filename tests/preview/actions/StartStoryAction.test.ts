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
  });
});
