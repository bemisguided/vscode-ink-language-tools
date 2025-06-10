import { Story } from "inkjs/engine/Story";
import { BindableFunction, CompiledStory } from "../../types";
import {
  StoryUpdate,
  FunctionCall,
  StoryEvent,
  TextStoryEvent,
  FunctionStoryEvent,
} from "./types";

/**
 * Manages the story state and progression.
 * Handles story continuation, choice selection, and function calls.
 */
export class StoryModel {
  // Private Properties ===============================================================================================

  private currentFunctionCalls: FunctionCall[] = [];
  private story: Story;

  // Constructor ======================================================================================================

  constructor(compiledStory: CompiledStory) {
    this.story = compiledStory.story;
    this.bindExternalFunctions(compiledStory.bindableFunctions);
  }

  // Public Methods ===================================================================================================

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
      const lineText = this.story.Continue();
      if (lineText) {
        const lineTags = this.story.currentTags || [];
        allTags = allTags.concat(lineTags);

        // Add text event
        const textEvent: TextStoryEvent = {
          type: "text",
          text: lineText,
          tags: lineTags,
        };
        events.push(textEvent);
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

    this.story.ChooseChoiceIndex(index);
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
    this.story.ResetState();
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
        },
        false
      );
    });
  }

  private ensureStoryIsLoaded(): void {
    if (!this.story) {
      throw new Error("No story loaded");
    }
  }
}
