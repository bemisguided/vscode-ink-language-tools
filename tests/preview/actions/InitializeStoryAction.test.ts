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

import { InitializeStoryAction } from "../../../src/preview/actions/InitializeStoryAction";
import { PreviewActionContext } from "../../../src/preview/PreviewActionContext";
import { mockPreviewActionContext } from "../../__mocks__/mockPreviewActionContext";
import { mockStoryState } from "../../__mocks__/mockStoryState";
import { PreviewState } from "../../../src/preview/PreviewState";
import { StoryState } from "../../../src/preview/StoryState";
import { mockPreviewState } from "../../__mocks__/mockPreviewState";

describe("InitializeStoryAction", () => {
  function setupState(story: StoryState = mockStoryState()): PreviewState {
    return {
      ...mockPreviewState(),
      story,
    };
  }
  let mockContext: PreviewActionContext;
  let mockStoryManager: any;

  beforeEach(() => {
    // Set up
    mockStoryManager = {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      ResetState: jest.fn(),
    };

    mockContext = mockPreviewActionContext();
  });

  describe("apply()", () => {
    test("should not mutate state", () => {
      // Setup
      const story: StoryState = mockStoryState();
      const action = new InitializeStoryAction();

      // Execute
      action.apply(setupState(story));

      // Assert
      expect(mockContext.getState().story).toEqual(story);
    });
  });

  describe("effect()", () => {
    // TODO: preview-state: implement effect() tests
  });
});
