import { Story } from "inkjs/engine/Story";
import { StoryState, StoryUpdate, Choice, FunctionCall } from "./StoryState";
import { MockFunctionController } from "../controllers/MockFunctionController";

export class StoryModel {
  private story: Story | undefined;
  private state: StoryState;
  private functionCalls: FunctionCall[] = [];
  private mockFunctionController: MockFunctionController;

  constructor(mockFunctionController: MockFunctionController) {
    this.state = {
      text: "",
      tags: [],
      choices: [],
      functionCalls: [],
      hasEnded: false,
    };
    this.mockFunctionController = mockFunctionController;
  }

  public loadStory(jsonData: string): void {
    try {
      this.story = new Story(jsonData);
      this.functionCalls = [];

      // Bind mock functions to the story
      this.mockFunctionController.bindMockFunctions(
        this.story,
        (call: FunctionCall) => this.trackFunctionCall(call)
      );

      this.updateState();
    } catch (error) {
      throw new Error(`Failed to load story: ${error}`);
    }
  }

  public continueStory(): StoryUpdate {
    if (!this.story) {
      throw new Error("No story loaded");
    }

    let text = "";
    let allTags: string[] = [];

    while (this.story.canContinue) {
      const lineText = this.story.Continue();
      if (lineText) {
        text += lineText;
        const lineTags = this.story.currentTags || [];
        allTags = allTags.concat(lineTags);
      }
    }

    this.updateState();
    return {
      text,
      tags: [...new Set(allTags)],
      choices: this.getCurrentChoices(),
      hasEnded: this.state.hasEnded,
    };
  }

  public makeChoice(index: number): StoryUpdate {
    if (!this.story) {
      throw new Error("No story loaded");
    }

    this.story.ChooseChoiceIndex(index);
    return this.continueStory();
  }

  public getCurrentText(): string {
    return this.state.text;
  }

  public getCurrentTags(): string[] {
    return this.state.tags;
  }

  public getCurrentChoices(): Choice[] {
    return this.state.choices;
  }

  public getFunctionCalls(): FunctionCall[] {
    return this.functionCalls;
  }

  public trackFunctionCall(call: FunctionCall): void {
    this.functionCalls.push(call);
    // Keep only the last 10 calls
    if (this.functionCalls.length > 10) {
      this.functionCalls = this.functionCalls.slice(-10);
    }
  }

  private updateState(): void {
    if (!this.story) {
      return;
    }

    this.state.choices = this.story.currentChoices.map(
      (choice: any, index: number) => ({
        index,
        text: choice.text,
        tags: choice.tags || [],
      })
    );

    this.state.hasEnded =
      !this.story.canContinue && this.state.choices.length === 0;
  }
}
