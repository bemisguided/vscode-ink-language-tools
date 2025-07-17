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

import { PreviewAction, PreviewActionContext } from "../PreviewAction";

/**
 * Action to initialize the story by resetting the Ink story engine state.
 * This action performs the side effect of calling story.ResetState() to prepare
 * the story for execution from the beginning.
 */
export class InitializeStoryAction implements PreviewAction {
  // Static Properties ================================================================================================

  /**
   * The type identifier for this action.
   * Used for action identification, filtering, and debugging.
   */
  public static readonly typeId = "INITIALIZE_STORY";

  // Instance Properties ==============================================================================================

  /**
   * The type identifier for this action instance.
   */
  public readonly type = InitializeStoryAction.typeId;

  // Constructor ======================================================================================================

  /**
   * Creates a new InitializeStoryAction.
   * No parameters are required as this action only resets the story state.
   */
  constructor() {
    // No parameters needed
  }

  // Public Methods ===================================================================================================

  /**
   * Applies this action by resetting the story engine state.
   * This prepares the story for execution from the beginning by calling
   * the story manager's reset method.
   *
   * @param context - The action context providing access to the story manager
   */
  apply(context: PreviewActionContext): void {
    console.debug("[InitializeStoryAction] 🔄 Resetting story state");

    // Reset the story engine state using the story manager
    context.storyManager.reset();

    console.debug("[InitializeStoryAction] ✅ Story reset completed");
  }
}
