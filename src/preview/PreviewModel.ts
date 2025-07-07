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

import { Story } from "inkjs/engine/Story";
import { BindableFunction } from "../types";
import {
  StoryUpdate,
  FunctionCall,
  StoryEvent,
  TextStoryEvent,
  FunctionStoryEvent,
} from "./types";
import { ISuccessfulBuildResult } from "../build/IBuildResult";

export type ErrorCallback = (
  message: string,
  severity: "error" | "warning" | "info"
) => void;

/**
 * Manages the story state and progression.
 * Handles story continuation, choice selection, and function calls.
 */
export class PreviewModel {
  // Private Properties ===============================================================================================

  private currentFunctionCalls: FunctionCall[] = [];
  private errorCallback?: ErrorCallback;
  private story: Story;

  // Constructor ======================================================================================================

  constructor(compiledStory: ISuccessfulBuildResult) {
    this.story = compiledStory.story;
    this.story.onError = (error) => {
      // Propagate error immediately to controller via callback
      this.errorCallback?.(error.toString(), "error");
    };
  }

  // Public Methods ===================================================================================================

  /**
   * Registers a callback for when an error occurs during story execution.
   * @param callback - Function to call when an error occurs
   */
  public onError(callback: ErrorCallback): void {
    this.errorCallback = callback;
  }

  /**
   * Continues the story until it reaches a choice point or ends.
   * @returns A story update containing new events, choices, and end state
   * @throws Error if no story is loaded
   */
  public continueStory(): StoryUpdate {
    this.ensureStoryIsLoaded();

    // Guard against continuing a finished story
    if (this.isEnded()) {
      return {
        choices: [],
        hasEnded: true,
        events: [],
      };
    }

    const events: StoryEvent[] = [];
    let allTags: string[] = [];

    // Continue until we hit a choice point or the end
    while (this.story.canContinue) {
      // If safeContinue() returns false, either an error occurred or no text was produced - stop execution
      if (!this.doContinue(events, allTags)) {
        break;
      }
    }

    // Add any function calls that occurred during this continuation
    if (this.currentFunctionCalls.length > 0) {
      events.push(
        ...this.currentFunctionCalls.map((call) => {
          const functionEvent: FunctionStoryEvent = {
            type: "function",
            functionName: call.functionName,
            args: call.args,
            result: call.result,
          };
          return functionEvent;
        })
      );
    }

    // Get current choices
    const choices = this.story.currentChoices.map(
      (choice: any, index: number) => ({
        index,
        text: choice.text,
        tags: choice.tags || [],
      })
    );

    // Create update
    const update: StoryUpdate = {
      choices,
      hasEnded: this.isEnded(),
      events,
    };

    // Clear function calls for next continuation
    this.currentFunctionCalls = [];

    return update;
  }

  /**
   * Selects a choice in the story and continues.
   * @param index - The index of the choice to make
   * @returns A story update containing the result of the choice
   * @throws Error if no story is loaded
   */
  public selectChoice(index: number): StoryUpdate {
    this.ensureStoryIsLoaded();

    try {
      this.story.ChooseChoiceIndex(index);
    } catch (error) {
      // Handle synchronous errors during choice selection
      this.handleError(error, "Error selecting choice");

      // Return safe default state
      return {
        choices: [],
        hasEnded: true,
        events: [],
      };
    }

    return this.continueStory();
  }

  /**
   * Checks if the story has reached an end state.
   * @returns True if the story has ended
   */
  public isEnded(): boolean {
    this.ensureStoryIsLoaded();
    return !this.story.canContinue && this.story.currentChoices.length === 0;
  }

  /**
   * Resets the story to its initial state.
   * Clears all function calls and story state.
   */
  public reset(): void {
    this.ensureStoryIsLoaded();

    try {
      this.story.ResetState();
    } catch (error) {
      // Handle synchronous errors during story reset
      this.handleError(error, "Error resetting story state");
    }

    this.currentFunctionCalls = [];
  }

  // Private Methods ==================================================================================================

  /**
   * Records a function call made during story execution.
   * @param call - The function call to record
   */
  private addFunctionCall(call: FunctionCall): void {
    this.ensureStoryIsLoaded();
    this.currentFunctionCalls.push(call);
  }

  /**
   * Binds external functions to the story.
   * @param bindableFunctions - Array of functions to bind
   */
  private bindExternalFunctions(bindableFunctions: BindableFunction[]): void {
    this.ensureStoryIsLoaded();
    bindableFunctions.forEach((bindableFunction) => {
      this.story.BindExternalFunction(
        bindableFunction.name,
        (...args: any[]) => {
          const result = bindableFunction.fn.apply(this, args);
          this.addFunctionCall({
            functionName: bindableFunction.name,
            args,
            result,
            timestamp: Date.now(),
          });
          return result;
        },
        false
      );
    });
  }

  /**
   * Continues the story execution with error handling.
   * Handles the complete continue block including text extraction, tag processing, event creation, and accumulation.
   * @param events - Array to add the text event to
   * @param allTags - Array to accumulate tags to
   * @returns true if continue was successful and should continue, false if should stop (error or no text)
   */
  private doContinue(events: StoryEvent[], allTags: string[]): boolean {
    try {
      const lineText = this.story.Continue();

      // If no text was produced, return false to stop (normal case, not an error)
      if (!lineText) {
        return false;
      }

      // Get current tags after the continue call
      const lineTags = this.story.currentTags || [];

      // Create the text event
      const textEvent: TextStoryEvent = {
        type: "text",
        text: lineText,
        tags: lineTags,
      };

      // Add the event to the events array
      events.push(textEvent);

      // Track all tags for potential future use
      allTags.push(...lineTags);

      return true; // Continue processing
    } catch (error) {
      // Handle synchronous errors (validation, missing external functions, etc.)
      this.handleError(error, "Unknown story execution error");
      return false; // Stop processing due to error
    }
  }

  /**
   * Handles errors by extracting the message and calling the error callback.
   * @param error - The error that occurred
   * @param fallbackMessage - Message to use if error message cannot be extracted
   * @param severity - The severity level of the error (can be overridden by parsing)
   */
  private handleError(
    error: unknown,
    fallbackMessage: string = "Unknown error occurred",
    severity: "error" | "warning" | "info" = "error"
  ): void {
    const rawMessage = error instanceof Error ? error.message : fallbackMessage;
    const { message, severity: parsedSeverity } =
      this.parseErrorMessage(rawMessage);
    this.errorCallback?.(message, parsedSeverity || severity);
  }

  /**
   * Parses an error message to extract severity and clean message.
   * @param rawMessage - The raw error message
   * @returns Object with parsed message and severity
   */
  private parseErrorMessage(rawMessage: string): {
    message: string;
    severity: "error" | "warning" | "info" | null;
  } {
    // Default values
    let message = rawMessage;
    let severity: "error" | "warning" | "info" | null = null;

    // Extract severity from common prefixes
    if (rawMessage.startsWith("RUNTIME ERROR:")) {
      severity = "error";
    } else if (rawMessage.startsWith("RUNTIME WARNING:")) {
      severity = "warning";
    } else if (rawMessage.startsWith("Error:")) {
      severity = "error";
    } else if (rawMessage.startsWith("Warning:")) {
      severity = "warning";
    }

    // Find the first colon and extract message after it
    const firstColonIndex = rawMessage.indexOf(":");

    // If we have at least 1 colon, extract message after the first one
    if (firstColonIndex !== -1) {
      message = rawMessage.substring(firstColonIndex + 1).trim();
    }

    return { message, severity };
  }

  private ensureStoryIsLoaded(): void {
    if (!this.story) {
      throw new Error("No story loaded");
    }
  }
}
