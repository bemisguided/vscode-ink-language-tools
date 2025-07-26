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
} from "../../../src/preview/PreviewState";
import { StartStoryAction } from "../../../src/preview/actions/StartStoryAction";
import { PreviewActionContext } from "../../../src/preview/PreviewActionContext";
import { mockPreviewActionContext } from "../../__mocks__/mockPreviewActionContext";
import {
  mockPreviewState,
  mockPreviewStoryState,
} from "../../__mocks__/mockPreviewState";
import { SetCurrentChoicesAction } from "../../../src/preview/actions/SetCurrentChoicesAction";

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
    test("should not mutate state", () => {
      // Setup
      const story: PreviewStoryState = mockPreviewStoryState();
      const action = new StartStoryAction();

      // Execute
      action.apply(setupState(story));

      // Assert
      expect(mockContext.getState().story).toEqual(story);
    });
  });

  describe("effect()", () => {
    test("should reset the story state", () => {
      // Setup
      const action = new StartStoryAction();
      const context = mockPreviewActionContext();

      // Execute
      action.effect(context);

      // Assert
      expect(context.storyManager.reset).toHaveBeenCalled();
      expect(context.storyManager.continue).toHaveBeenCalled();
      expect(context.dispatch).toHaveBeenCalledWith(
        new SetCurrentChoicesAction([])
      );
    });
  });
});
