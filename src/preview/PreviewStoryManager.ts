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

import { Story } from "inkjs";
import { StoryProgressResult } from "./StoryProgressResult";
import {
  StoryEvent,
  TextStoryEvent,
  Choice,
  ErrorInfo,
  ErrorSeverity,
} from "./PreviewState";
import { parseErrorMessage } from "./parseErrorMessage";

/**
 * Result of a single story continuation attempt.
 */
interface ContinueResult {
  shouldContinue: boolean;
  error?: ErrorInfo;
}

/**
 * Manages story progression operations and encapsulates all direct interaction with the Ink Story engine.
 * This class provides a high-level interface for story operations while keeping the complex
 * story continuation logic centralized and reusable.
 */
export class PreviewStoryManager {
  // Private Properties ===============================================================================================

  private readonly story: Story;

  // Constructor ======================================================================================================

  /**
   * Creates a new PreviewStoryManager wrapping the provided Ink story instance.
   * @param story - The Ink story instance to manage
   */
  constructor(story: Story) {
    this.story = story;
  }

  // Public Methods ===================================================================================================

  /**
   * Resets the story to its initial state.
   * This prepares the story for execution from the beginning.
   */
  reset(): void {
    console.debug("[PreviewStoryManager] 🔄 Resetting story state");

    try {
      this.story.ResetState();
      console.debug("[PreviewStoryManager] ✅ Story state reset successfully");
    } catch (error) {
      console.error(
        "[PreviewStoryManager] ❌ Failed to reset story state:",
        error
      );
      // Note: We don't throw here to prevent breaking the action chain
      // The story will remain in its previous state if reset fails
    }
  }

  /**
   * Continues the story until it reaches a choice point or ends.
   * Collects all events generated during continuation and returns the result.
   * @returns StoryProgressResult containing events, choices, and end state
   */
  continue(): StoryProgressResult {
    console.debug("[PreviewStoryManager] ⏭️ Continuing story");

    // Guard against continuing a finished story
    if (this.isEnded()) {
      return {
        events: [],
        choices: [],
        isEnded: true,
        errors: [],
      };
    }

    const events: StoryEvent[] = [];
    const errors: ErrorInfo[] = [];
    let allTags: string[] = [];

    // Continue until we hit a choice point or the end
    while (this.story.canContinue) {
      const continueResult = this.doContinue(events, allTags);

      if (continueResult.error) {
        errors.push(continueResult.error);
      }

      // If doContinue() indicates we should stop, break the loop
      if (!continueResult.shouldContinue) {
        break;
      }
    }

    // Get current choices
    const choices = this.getCurrentChoices();
    const isEnded = this.isEnded();

    console.debug(
      `[PreviewStoryManager] ✅ Continue completed: ${events.length} events, ${choices.length} choices, ${errors.length} errors, ended: ${isEnded}`
    );

    return {
      events,
      choices,
      isEnded,
      errors,
    };
  }

  /**
   * Selects a choice and then continues the story until the next choice point or end.
   * Combines choice selection with story continuation in a single operation.
   * @param choiceIndex - The index of the choice to select
   * @returns StoryProgressResult containing events, choices, and end state after selection
   */
  selectChoice(choiceIndex: number): StoryProgressResult {
    console.debug(`[PreviewStoryManager] 🎯 Selecting choice ${choiceIndex}`);

    try {
      // Select the choice
      this.story.ChooseChoiceIndex(choiceIndex);

      // Continue story after choice selection
      return this.continue();
    } catch (error) {
      console.error("[PreviewStoryManager] ❌ Error selecting choice:", error);

      // Return safe default state after error
      const { message, severity } = parseErrorMessage(
        error instanceof Error
          ? error.message
          : "Unknown error selecting choice"
      );

      return {
        events: [],
        choices: [],
        isEnded: true,
        errors: [
          {
            message,
            severity: severity || "error",
          },
        ],
      };
    }
  }

  /**
   * Checks if the story has reached an end state.
   * @returns True if the story has ended (cannot continue and has no choices)
   */
  isEnded(): boolean {
    return !this.story.canContinue && this.story.currentChoices.length === 0;
  }

  /**
   * Checks if the story can continue.
   * @returns True if the story can continue with more content
   */
  canContinue(): boolean {
    return this.story.canContinue;
  }

  /**
   * Gets the current available choices.
   * @returns Array of current choices available to the player
   */
  getCurrentChoices(): Choice[] {
    return this.story.currentChoices.map((choice: any, index: number) => ({
      index,
      text: choice.text,
      tags: choice.tags || [],
    }));
  }

  // Private Methods ==================================================================================================

  /**
   * Continues the story execution with error handling.
   * Handles the complete continue block including text extraction, tag processing, and event creation.
   * @param events - Array to add the text event to
   * @param allTags - Array to accumulate tags to
   * @returns ContinueResult indicating whether to continue and any errors that occurred
   */
  private doContinue(events: StoryEvent[], allTags: string[]): ContinueResult {
    try {
      const lineText = this.story.Continue();

      // If no text was produced, return false to stop (normal case, not an error)
      if (!lineText) {
        return { shouldContinue: false };
      }

      // Get current tags after the continue call
      const lineTags = this.story.currentTags || [];

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

      return { shouldContinue: true }; // Continue processing
    } catch (error) {
      console.error(
        "[PreviewStoryManager] ❌ Error during story continuation:",
        error
      );

      // Parse and return the error
      const { message, severity } = parseErrorMessage(
        error instanceof Error ? error.message : "Unknown story execution error"
      );

      return {
        shouldContinue: false,
        error: {
          message,
          severity: severity || "error",
        },
      };
    }
  }
}
