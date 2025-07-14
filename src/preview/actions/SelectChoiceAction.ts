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
import { ContinueStoryAction } from "./ContinueStoryAction";
import { AddErrorsAction } from "./AddErrorsAction";
import { EndStoryAction } from "./EndStoryAction";
import { SetCurrentChoicesAction } from "./SetCurrentChoicesAction";
import { ErrorInfo } from "../PreviewState";
import { parseErrorMessage } from "../parseErrorMessage";

/**
 * Action to select a choice in the story and then continue until the next choice point or end.
 * This action uses composition to reuse the continue logic after choice selection.
 */
export class SelectChoiceAction implements PreviewAction {
  // Static Properties ================================================================================================

  /**
   * The type identifier for this action.
   * Used for action identification, filtering, and debugging.
   */
  public static readonly typeId = "SELECT_CHOICE";

  // Instance Properties ==============================================================================================

  /**
   * The type identifier for this action instance.
   */
  public readonly type = SelectChoiceAction.typeId;

  /**
   * The index of the choice to select.
   */
  private readonly choiceIndex: number;

  /**
   * The continue action used for story progression after choice selection.
   */
  private readonly continueAction: ContinueStoryAction;

  // Constructor ======================================================================================================

  /**
   * Creates a new SelectChoiceAction.
   * @param choiceIndex - The index of the choice to select
   */
  constructor(choiceIndex: number) {
    this.choiceIndex = choiceIndex;
    this.continueAction = new ContinueStoryAction();
  }

  // Public Methods ===================================================================================================

  /**
   * Applies this action to select a choice and continue the story.
   * Selects the specified choice index and then continues story progression.
   *
   * @param context - The action context providing state access and dispatch capability
   */
  apply(context: PreviewActionContext): void {
    const story = context.story; // Guaranteed to be available

    try {
      // 1. Select the choice
      story.ChooseChoiceIndex(this.choiceIndex);

      // 2. Continue story using composition
      this.continueAction.apply(context);
    } catch (error) {
      // Handle synchronous errors during choice selection
      this.handleChoiceError(error, "Error selecting choice", context);

      // Set safe default state after error
      context.dispatch(new SetCurrentChoicesAction([]));
      context.dispatch(new EndStoryAction());
    }
  }

  // Private Methods ==================================================================================================

  /**
   * Handles errors that occur during choice selection.
   * @param error - The error that occurred
   * @param fallbackMessage - Message to use if error message cannot be extracted
   * @param context - The action context for dispatching errors
   */
  private handleChoiceError(
    error: unknown,
    fallbackMessage: string,
    context: PreviewActionContext
  ): void {
    const rawMessage = error instanceof Error ? error.message : fallbackMessage;
    const { message, severity } = parseErrorMessage(rawMessage);

    const errorInfo: ErrorInfo = {
      message,
      severity: severity || "error",
    };

    context.dispatch(new AddErrorsAction([errorInfo]));
  }
}
