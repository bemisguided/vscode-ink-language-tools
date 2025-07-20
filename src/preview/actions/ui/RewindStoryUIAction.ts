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

import { UIAction } from "../UIAction";
import { UIActionContext } from "../../UIActionContext";

/**
 * UI Action to rewind the story to the last choice point.
 * This action restores the story state to the previous choice,
 * allowing the user to make a different selection.
 *
 * The rewind functionality goes back to the state before the last
 * SelectChoiceAction was applied. If no choices exist in the story
 * history, it rewinds to the beginning.
 */
export class RewindStoryUIAction implements UIAction {
  // Static Properties ================================================================================================

  /**
   * The type identifier for this action.
   * Used for action identification, filtering, and debugging.
   */
  public static readonly typeId = "REWIND_STORY";

  // Public Properties ==============================================================================================

  /**
   * @inheritdoc
   */
  readonly category = "ui" as const;

  /**
   * @inheritdoc
   */
  readonly type = RewindStoryUIAction.typeId;

  // Public Methods ===================================================================================================

  /**
   * @inheritdoc
   */
  apply(context: UIActionContext): void {
    console.debug("[RewindStoryUIAction] Rewinding story to last choice");

    // Rewind the story to the last choice point
    context.rewindStoryToLastChoice();

    // Send updated state to webview
    context.sendStoryState();
  }
}
