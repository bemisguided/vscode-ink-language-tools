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

import { PreviewAction } from "./PreviewAction";
import { StoryActionContext } from "./StoryActionContext";

/**
 * Actions that operate on story domain state and perform story-related operations.
 * These actions have access to story state, story manager, and can dispatch other actions.
 * They use StoryActionContext for type-safe access to story domain concerns only.
 */
export interface StoryAction extends PreviewAction {
  /**
   * Indicates that the Category of this Preview Action is "story".
   */
  category: "story";

  /**
   * Applies this story action within the given story context.
   *
   * This method can:
   * - Update story state via context.setState()
   * - Interact with the story engine via context.storyManager
   * - Dispatch other actions via context.dispatch()
   * - Send story state updates via context.sendStoryState()
   *
   * The method should be idempotent when possible to support replay functionality.
   *
   * @param context - The story action context providing story domain access
   */
  apply(context: StoryActionContext): void;
}
