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

import { EndStoryAction } from "../../../src/preview/actions/EndStoryAction";
import { PreviewState } from "../../../src/preview/PreviewState";
import {
  PreviewStoryState,
  StoryEvent,
} from "../../../src/preview/PreviewState";
import {
  mockPreviewState,
  mockPreviewStoryState,
} from "../../__mocks__/mockPreviewState";

describe("EndStoryAction", () => {
  function setupState(
    story: PreviewStoryState = mockPreviewStoryState()
  ): PreviewState {
    return {
      ...mockPreviewState(),
      story,
    };
  }
  let action: EndStoryAction;

  beforeEach(() => {
    action = new EndStoryAction();
  });

  describe("apply", () => {
    test("should set isEnded to true", () => {
      // Setup
      const currentState: PreviewState = setupState({
        ...mockPreviewStoryState(),
        isEnded: false,
      });

      // Execute
      const newState = action.apply(currentState);

      // Assert
      expect(newState.story.isEnded).toBe(true);
    });

    test("should work when isEnded is already true", () => {
      // Setup
      const currentState: PreviewState = setupState({
        ...mockPreviewStoryState(),
        isEnded: true,
      });

      // Execute
      const newState = action.apply(currentState);

      // Assert
      expect(newState.story.isEnded).toBe(true);
    });
  });
});
