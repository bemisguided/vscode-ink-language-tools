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

import { PreviewActionContext } from "../../src/preview/PreviewActionContext";
import { mockPreviewState } from "./mockPreviewState";

/**
 * Creates a mock PreviewActionContext with default Jest mocks and optional overrides.
 * This allows tests to only specify properties relevant to the test case while ensuring
 * all required interface properties are properly mocked.
 *
 * @param overrides - Partial PreviewActionContext to override defaults
 * @returns Complete PreviewActionContext with Jest mocks
 *
 * @example
 * ```typescript
 * // Use with defaults
 * const context = mockPreviewActionContext();
 *
 * // Override specific methods
 * const context = mockPreviewActionContext({
 *   getState: jest.fn().mockReturnValue(customState),
 *   dispatch: jest.fn().mockImplementation((action) => console.log(action))
 * });
 *
 * // Override storyManager methods
 * const context = mockPreviewActionContext({
 *   storyManager: {
 *     ...mockPreviewActionContext().storyManager,
 *     continue: jest.fn().mockReturnValue({ events: [], errors: [] })
 *   }
 * });
 * ```
 */
export function mockPreviewActionContext(
  overrides: Partial<PreviewActionContext> = {}
): PreviewActionContext {
  const defaultContext: PreviewActionContext = {
    getState: jest.fn().mockReturnValue(mockPreviewState()),
    dispatch: jest.fn(),
    storyManager: {
      reset: jest.fn(),
      continue: jest.fn().mockReturnValue({
        events: [],
        errors: [],
        choices: [],
        isEnded: false,
      }),
      selectChoice: jest.fn().mockReturnValue({
        events: [],
        errors: [],
        choices: [],
        isEnded: false,
      }),
      isEnded: jest.fn().mockReturnValue(false),
      canContinue: jest.fn().mockReturnValue(false),
      getCurrentChoices: jest.fn().mockReturnValue([]),
    } as any,
    sendStoryState: jest.fn(),
    undo: jest.fn(),
    undoToLast: jest.fn(),
  };

  return {
    ...defaultContext,
    ...overrides,
  };
}
