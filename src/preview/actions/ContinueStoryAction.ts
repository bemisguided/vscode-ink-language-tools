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
import { StoryEvent, TextStoryEvent } from "../types";
import { AddStoryEventsAction } from "./AddStoryEventsAction";
import { SetCurrentChoicesAction } from "./SetCurrentChoicesAction";
import { EndStoryAction } from "./EndStoryAction";
import { AddErrorsAction } from "./AddErrorsAction";
import { ErrorInfo } from "../ErrorInfo";
import { parseErrorMessage } from "../parseErrorMessage";

/**
 * Action to continue the story until it reaches a choice point or ends.
 * This action handles the main story progression loop, collecting events,
 * extracting choices, and dispatching appropriate state mutations.
 */
export class ContinueStoryAction implements PreviewAction {
  apply(context: PreviewActionContext): void {
    const story = context.story;
    if (!story) {
      throw new Error("No story available in context");
    }

    // Guard against continuing a finished story
    if (this.isEnded(story)) {
      // Dispatch end action and empty choices
      context.dispatch(new SetCurrentChoicesAction([]));
      context.dispatch(new EndStoryAction());
      return;
    }

    const events: StoryEvent[] = [];
    let allTags: string[] = [];

    // Continue until we hit a choice point or the end
    while (story.canContinue) {
      // If doContinue() returns false, either an error occurred or no text was produced - stop execution
      if (!this.doContinue(story, events, allTags, context)) {
        break;
      }
    }

    // TODO: Function call handling - commented out for now during refactoring
    // if (this.currentFunctionCalls.length > 0) {
    //   events.push(
    //     ...this.currentFunctionCalls.map((call) => {
    //       const functionEvent: FunctionStoryEvent = {
    //         type: "function",
    //         functionName: call.functionName,
    //         args: call.args,
    //         result: call.result,
    //         isCurrent: false, // Set to false here as it will be set properly by AddStoryEventsAction
    //       };
    //       return functionEvent;
    //     })
    //   );
    // }

    // Get current choices
    const choices = story.currentChoices.map((choice: any, index: number) => ({
      index,
      text: choice.text,
      tags: choice.tags || [],
    }));

    // Dispatch state mutations
    if (events.length > 0) {
      context.dispatch(new AddStoryEventsAction(events));
    }

    context.dispatch(new SetCurrentChoicesAction(choices));

    if (this.isEnded(story)) {
      context.dispatch(new EndStoryAction());
    }

    // TODO: Clear function calls for next continuation - commented out for now
    // this.currentFunctionCalls = [];
  }

  /**
   * Checks if the story has reached an end state.
   * @param story - The Ink story instance
   * @returns True if the story has ended
   */
  private isEnded(story: any): boolean {
    return !story.canContinue && story.currentChoices.length === 0;
  }

  /**
   * Continues the story execution with error handling.
   * Handles the complete continue block including text extraction, tag processing, event creation, and accumulation.
   * @param story - The Ink story instance
   * @param events - Array to add the text event to
   * @param allTags - Array to accumulate tags to
   * @param context - The action context for error handling
   * @returns true if continue was successful and should continue, false if should stop (error or no text)
   */
  private doContinue(
    story: any,
    events: StoryEvent[],
    allTags: string[],
    context: PreviewActionContext
  ): boolean {
    try {
      const lineText = story.Continue();

      // If no text was produced, return false to stop (normal case, not an error)
      if (!lineText) {
        return false;
      }

      // Get current tags after the continue call
      const lineTags = story.currentTags || [];

      // Create the text event
      const textEvent: TextStoryEvent = {
        type: "text",
        text: lineText,
        tags: lineTags,
        isCurrent: false, // Set to false here as it will be set properly by AddStoryEventsAction
      };

      // Add the event to the events array
      events.push(textEvent);

      // Track all tags for potential future use
      allTags.push(...lineTags);

      return true; // Continue processing
    } catch (error) {
      // Handle synchronous errors (validation, missing external functions, etc.)
      this.handleError(error, "Unknown story execution error", context);
      return false; // Stop processing due to error
    }
  }

  /**
   * Handles errors by extracting the message and dispatching error actions.
   * @param error - The error that occurred
   * @param fallbackMessage - Message to use if error message cannot be extracted
   * @param context - The action context for dispatching errors
   * @param severity - The severity level of the error (can be overridden by parsing)
   */
  private handleError(
    error: unknown,
    fallbackMessage: string = "Unknown error occurred",
    context: PreviewActionContext,
    severity: "error" | "warning" | "info" = "error"
  ): void {
    const rawMessage = error instanceof Error ? error.message : fallbackMessage;
    const { message, severity: parsedSeverity } = parseErrorMessage(rawMessage);

    const errorInfo: ErrorInfo = {
      message,
      severity: parsedSeverity || severity,
    };

    context.dispatch(new AddErrorsAction([errorInfo]));
  }
}
