import { StoryModel } from "../models/StoryModel";
import { StoryView } from "../views/StoryView";
import { StoryUpdate } from "../models/StoryState";
import { MockFunctionController } from "./MockFunctionController";

export class StoryController {
  private model: StoryModel;
  private view: StoryView;
  private mockFunctionController: MockFunctionController;

  constructor(view: StoryView, mockFunctionController: MockFunctionController) {
    this.view = view;
    this.mockFunctionController = mockFunctionController;
    this.model = new StoryModel(mockFunctionController);
    this.setupEventHandlers();
  }

  public loadStory(jsonData: string): void {
    try {
      this.model.loadStory(jsonData);
      const update = this.model.continueStory();
      this.updateView(update);
    } catch (error) {
      if (error instanceof Error) {
        this.view.showError(error.message);
      } else {
        this.view.showError("An unknown error occurred");
      }
    }
  }

  public makeChoice(index: number): void {
    try {
      const update = this.model.makeChoice(index);
      this.updateView(update);
    } catch (error) {
      if (error instanceof Error) {
        this.view.showError(error.message);
      } else {
        this.view.showError("An unknown error occurred");
      }
    }
  }

  public restartStory(): void {
    try {
      const update = this.model.continueStory();
      this.updateView(update);
    } catch (error) {
      if (error instanceof Error) {
        this.view.showError(error.message);
      } else {
        this.view.showError("An unknown error occurred");
      }
    }
  }

  private setupEventHandlers(): void {
    this.view.onChoiceSelected((index: number) => {
      this.makeChoice(index);
    });

    this.view.onRestart(() => {
      this.restartStory();
    });
  }

  private updateView(update: StoryUpdate): void {
    this.view.updateStory(update, this.model.getFunctionCalls());
  }
}
