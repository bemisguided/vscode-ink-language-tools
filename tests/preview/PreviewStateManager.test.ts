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

import { PreviewStateManager } from "../../src/preview/PreviewStateManager";
import { PreviewState } from "../../src/preview/PreviewState";
import { StoryEvent, Choice } from "../../src/preview/types";
import { ErrorInfo } from "../../src/preview/PreviewState";
import {
  PreviewAction,
  PreviewActionContext,
} from "../../src/preview/PreviewAction";

// Import all actions
import { StartStoryAction } from "../../src/preview/actions/StartStoryAction";
import { EndStoryAction } from "../../src/preview/actions/EndStoryAction";
import { AddStoryEventsAction } from "../../src/preview/actions/AddStoryEventsAction";
import { SetCurrentChoicesAction } from "../../src/preview/actions/SetCurrentChoicesAction";
import { AddErrorsAction } from "../../src/preview/actions/AddErrorsAction";
import { ClearErrorsAction } from "../../src/preview/actions/ClearErrorsAction";
import { InitializeStoryAction } from "../../src/preview/actions/InitializeStoryAction";

// Import mock helpers
import { mockPreviewState } from "../__mocks__/mockPreviewState";

/**
 * Mock action A for testing history functionality
 */
class MockActionA implements PreviewAction {
  public static readonly typeId = "MOCK_ACTION_A";
  public readonly type = MockActionA.typeId;

  apply(context: PreviewActionContext): void {
    const currentState = context.getState();
    context.setState({
      ...currentState,
      isStart: true,
    });
  }
}

/**
 * Mock action B for testing history functionality
 */
class MockActionB implements PreviewAction {
  public static readonly typeId = "MOCK_ACTION_B";
  public readonly type = MockActionB.typeId;

  apply(context: PreviewActionContext): void {
    const currentState = context.getState();
    context.setState({
      ...currentState,
      isEnded: true,
    });
  }
}

/**
 * Mock action that simulates SELECT_CHOICE for rewind testing
 */
class MockSelectChoiceAction implements PreviewAction {
  public static readonly typeId = "SELECT_CHOICE";
  public readonly type = MockSelectChoiceAction.typeId;

  constructor(private choiceIndex: number) {}

  apply(context: PreviewActionContext): void {
    const currentState = context.getState();
    context.setState({
      ...currentState,
      storyEvents: [
        ...currentState.storyEvents,
        {
          type: "text",
          text: `Selected choice ${this.choiceIndex}`,
          tags: [],
          isCurrent: true,
        },
      ],
    });
  }
}

describe("PreviewStateManager", () => {
  let stateManager: PreviewStateManager;

  beforeEach(() => {
    stateManager = new PreviewStateManager();
  });

  afterEach(() => {
    stateManager.dispose();
  });

  describe("Constructor and Initialization", () => {
    it("should create with default state", () => {
      // Execute
      const state = stateManager.getState();

      // Assert
      expect(state).toEqual(mockPreviewState());
    });

    it("should create with partial initial state", () => {
      // Set up
      const customStateManager = new PreviewStateManager({
        isStart: true,
      });

      // Execute
      const state = customStateManager.getState();

      // Assert
      expect(state).toEqual(
        mockPreviewState({
          isStart: true,
        })
      );

      customStateManager.dispose();
    });
  });

  describe("Action Dispatching", () => {
    it("should dispatch StartStoryAction", () => {
      // Set up
      stateManager.dispatch(
        new AddStoryEventsAction([
          { type: "text" as const, text: "Test event", tags: [] },
        ])
      );
      const action = new StartStoryAction();

      // Execute
      const newState = stateManager.dispatch(action);

      // Assert
      expect(newState).toEqual(mockPreviewState({ isStart: true }));
      expect(stateManager.getState()).toEqual(newState);
    });

    it("should dispatch EndStoryAction", () => {
      // Set up
      const action = new EndStoryAction();

      // Execute
      const newState = stateManager.dispatch(action);

      // Assert
      expect(newState).toEqual(mockPreviewState({ isEnded: true }));
      expect(stateManager.getState()).toEqual(newState);
    });

    it("should dispatch AddStoryEventsAction", () => {
      // Set up
      const events: StoryEvent[] = [
        { type: "text" as const, text: "Event 1", tags: ["tag1"] },
        {
          type: "function" as const,
          functionName: "testFunc",
          args: [1],
          result: 2,
        },
      ];
      const action = new AddStoryEventsAction(events);

      // Execute
      const newState = stateManager.dispatch(action);

      // Assert
      // Events should have isCurrent: true added by AddStoryEventsAction
      const expectedEvents: StoryEvent[] = [
        {
          type: "text" as const,
          text: "Event 1",
          tags: ["tag1"],
          isCurrent: true,
        },
        {
          type: "function" as const,
          functionName: "testFunc",
          args: [1],
          result: 2,
          isCurrent: true,
        },
      ];
      expect(newState).toEqual(
        mockPreviewState({ storyEvents: expectedEvents })
      );
      expect(stateManager.getState()).toEqual(newState);
    });

    it("should dispatch SetCurrentChoicesAction", () => {
      // Set up
      const choices: Choice[] = [
        { index: 0, text: "Choice 1", tags: ["choice"] },
        { index: 1, text: "Choice 2", tags: [] },
      ];
      const action = new SetCurrentChoicesAction(choices);

      // Execute
      const newState = stateManager.dispatch(action);

      // Assert
      expect(newState).toEqual(mockPreviewState({ currentChoices: choices }));
      expect(stateManager.getState()).toEqual(newState);
    });

    it("should dispatch AddErrorsAction", () => {
      // Set up
      const errors: ErrorInfo[] = [
        { message: "Error 1", severity: "error" },
        { message: "Warning 1", severity: "warning" },
      ];
      const action = new AddErrorsAction(errors);

      // Execute
      const newState = stateManager.dispatch(action);

      // Assert
      expect(newState).toEqual(mockPreviewState({ errors }));
      expect(stateManager.getState()).toEqual(newState);
    });

    it("should dispatch ClearErrorsAction", () => {
      // Set up
      stateManager.dispatch(
        new AddErrorsAction([{ message: "Error to clear", severity: "error" }])
      );
      const action = new ClearErrorsAction();

      // Execute
      const newState = stateManager.dispatch(action);

      // Assert
      expect(newState).toEqual(mockPreviewState({ errors: [] }));
      expect(stateManager.getState()).toEqual(newState);
    });

    it("should return new state after each dispatch", () => {
      // Set up
      const initialState = stateManager.getState();
      const action = new StartStoryAction();

      // Execute
      const newState = stateManager.dispatch(action);

      // Assert
      expect(newState).not.toBe(initialState);
      expect(newState).toEqual(mockPreviewState({ isStart: true }));
      expect(initialState).toEqual(mockPreviewState({ isStart: false }));
    });
  });

  describe("State Access", () => {
    it("should return current state", () => {
      // Execute
      const state = stateManager.getState();

      // Assert
      expect(state).toEqual(mockPreviewState());
    });

    it("should return copy of state, not reference", () => {
      // Execute
      const state1 = stateManager.getState();
      const state2 = stateManager.getState();

      // Assert
      expect(state1).not.toBe(state2);
      expect(state1).toEqual(state2);
    });

    it("should reflect state changes", () => {
      // Set up
      const initialState = stateManager.getState();
      expect(initialState).toEqual(mockPreviewState({ isStart: false }));

      // Execute
      stateManager.dispatch(new StartStoryAction());
      const updatedState = stateManager.getState();

      // Assert
      expect(updatedState).toEqual(mockPreviewState({ isStart: true }));
      expect(initialState).toEqual(mockPreviewState({ isStart: false })); // Original should be unchanged
    });
  });

  describe("State Immutability", () => {
    it("should not mutate state when dispatching actions", () => {
      // Set up
      const initialState = stateManager.getState();
      const initialStateCopy = JSON.parse(JSON.stringify(initialState));

      // Execute
      stateManager.dispatch(new StartStoryAction());

      // Assert
      expect(initialState).toEqual(initialStateCopy);
    });

    it("should maintain immutability across multiple dispatches", () => {
      // Set up
      const states: PreviewState[] = [];
      states.push(stateManager.getState());

      // Execute
      stateManager.dispatch(new StartStoryAction());
      states.push(stateManager.getState());

      stateManager.dispatch(
        new AddStoryEventsAction([
          { type: "text" as const, text: "Event", tags: [] },
        ])
      );
      states.push(stateManager.getState());

      stateManager.dispatch(
        new SetCurrentChoicesAction([{ index: 0, text: "Choice", tags: [] }])
      );
      states.push(stateManager.getState());

      // Assert
      expect(states[0]).toEqual(mockPreviewState({ isStart: false }));
      expect(states[1]).toEqual(mockPreviewState({ isStart: true }));
      expect(states[2]).toEqual(
        mockPreviewState({
          isStart: true,
          storyEvents: [
            { type: "text", text: "Event", tags: [], isCurrent: true },
          ],
        })
      );
      expect(states[3]).toEqual(
        mockPreviewState({
          isStart: true,
          storyEvents: [
            { type: "text", text: "Event", tags: [], isCurrent: true },
          ],
          currentChoices: [{ index: 0, text: "Choice", tags: [] }],
          lastChoiceIndex: 1, // storyEvents.length is 1
        })
      );
    });
  });

  describe("Reset Functionality", () => {
    it("should reset to default state", () => {
      // Set up
      stateManager.dispatch(new StartStoryAction());
      stateManager.dispatch(
        new AddStoryEventsAction([
          { type: "text" as const, text: "Event", tags: [] },
        ])
      );
      stateManager.dispatch(
        new AddErrorsAction([{ message: "Error", severity: "error" }])
      );

      // Execute
      stateManager.reset();

      // Assert
      expect(stateManager.getState()).toEqual(mockPreviewState());
    });
  });

  describe("Dispose Functionality", () => {
    it("should dispose and clear state", () => {
      // Set up
      stateManager.dispatch(new StartStoryAction());
      stateManager.dispatch(
        new AddStoryEventsAction([
          { type: "text" as const, text: "Event", tags: [] },
        ])
      );

      // Execute
      stateManager.dispose();

      // Assert
      expect(stateManager.getState()).toEqual(mockPreviewState());
    });
  });

  describe("History Functionality", () => {
    it("should track action history", () => {
      // Set up
      const initialHistory = stateManager.getHistory();
      expect(initialHistory).toEqual([]);

      // Execute
      stateManager.dispatch(new StartStoryAction());
      stateManager.dispatch(
        new AddStoryEventsAction([{ type: "text", text: "Event", tags: [] }])
      );

      // Assert
      const history = stateManager.getHistory();
      expect(history).toHaveLength(2);
      expect(history[0].action).toBeInstanceOf(StartStoryAction);
      expect(history[1].action).toBeInstanceOf(AddStoryEventsAction);
    });

    it("should clear history", () => {
      // Set up
      stateManager.dispatch(new StartStoryAction());
      stateManager.dispatch(new EndStoryAction());
      expect(stateManager.getHistory()).toHaveLength(2);

      // Execute
      stateManager.clearHistory();

      // Assert
      expect(stateManager.getHistory()).toEqual([]);
    });

    it("should replay history to specific index", () => {
      // Set up
      stateManager.dispatch(new StartStoryAction());
      stateManager.dispatch(
        new AddStoryEventsAction([{ type: "text", text: "Event 1", tags: [] }])
      );
      stateManager.dispatch(
        new AddStoryEventsAction([{ type: "text", text: "Event 2", tags: [] }])
      );

      // Execute - replay to index 1 (only first action)
      const state = stateManager.replay(1);

      // Assert
      expect(state).toEqual(mockPreviewState({ isStart: true }));
      expect(stateManager.getHistory()).toHaveLength(1);
    });

    it("should replay entire history when no index provided", () => {
      // Set up
      stateManager.dispatch(new StartStoryAction());
      stateManager.dispatch(new EndStoryAction());
      const originalHistory = stateManager.getHistory();

      // Execute
      const state = stateManager.replay();

      // Assert
      expect(state).toEqual(
        mockPreviewState({ isStart: false, isEnded: true })
      );
      expect(stateManager.getHistory()).toHaveLength(originalHistory.length);
    });

    it("should undo last action", () => {
      // Set up
      stateManager.dispatch(new StartStoryAction());
      stateManager.dispatch(new EndStoryAction());
      expect(stateManager.getState()).toEqual(
        mockPreviewState({ isStart: false, isEnded: true })
      );

      // Execute
      const state = stateManager.undo();

      // Assert
      expect(state).toEqual(
        mockPreviewState({ isStart: true, isEnded: false })
      );
      expect(stateManager.getHistory()).toHaveLength(1);
    });

    it("should return current state when undoing with no history", () => {
      // Set up
      const initialState = stateManager.getState();

      // Execute
      const state = stateManager.undo();

      // Assert
      expect(state).toEqual(initialState);
      expect(stateManager.getHistory()).toHaveLength(0);
    });
  });

  describe("Generic Undo Pattern", () => {
    it("should undo to last occurrence of specific action type", () => {
      // Set up
      stateManager.dispatch(new StartStoryAction());
      stateManager.dispatch(
        new AddStoryEventsAction([{ type: "text", text: "Event 1", tags: [] }])
      );
      stateManager.dispatch(
        new AddStoryEventsAction([{ type: "text", text: "Event 2", tags: [] }])
      );
      stateManager.dispatch(new EndStoryAction());

      // Execute - undo to last ADD_STORY_EVENTS
      const state = stateManager.undoToLast("ADD_STORY_EVENTS");

      // Assert
      expect(state).toEqual(
        mockPreviewState({
          isStart: true,
          storyEvents: [
            { type: "text", text: "Event 1", tags: [], isCurrent: true },
          ],
        })
      );
      expect(stateManager.getHistory()).toHaveLength(2); // StartStoryAction and first AddStoryEventsAction
    });

    it("should undo to beginning when action type not found", () => {
      // Set up
      stateManager.dispatch(new StartStoryAction());
      stateManager.dispatch(new EndStoryAction());

      // Execute - undo to non-existent action type
      const state = stateManager.undoToLast("NON_EXISTENT_ACTION");

      // Assert
      expect(state).toEqual(mockPreviewState());
      expect(stateManager.getHistory()).toHaveLength(0);
    });

    it("should handle multiple occurrences of same action type", () => {
      // Set up
      stateManager.dispatch(new StartStoryAction());
      stateManager.dispatch(
        new AddErrorsAction([{ message: "Error 1", severity: "error" }])
      );
      stateManager.dispatch(
        new AddStoryEventsAction([{ type: "text", text: "Event", tags: [] }])
      );
      stateManager.dispatch(
        new AddErrorsAction([{ message: "Error 2", severity: "warning" }])
      );

      // Execute - should undo to LAST AddErrorsAction
      const state = stateManager.undoToLast("ADD_ERRORS");

      // Assert
      expect(state).toEqual(
        mockPreviewState({
          isStart: true,
          errors: [{ message: "Error 1", severity: "error" }],
          storyEvents: [
            { type: "text", text: "Event", tags: [], isCurrent: true },
          ],
        })
      );
      expect(stateManager.getHistory()).toHaveLength(3); // StartStoryAction, first AddErrorsAction, AddStoryEventsAction
    });

    it("should work with empty history", () => {
      // Execute
      const state = stateManager.undoToLast("START_STORY");

      // Assert
      expect(state).toEqual(mockPreviewState());
      expect(stateManager.getHistory()).toHaveLength(0);
    });
  });

  describe("Rewind Functionality", () => {
    it("should rewind to last choice selection", () => {
      // Set up
      const mockStory = { ResetState: jest.fn() };
      stateManager.setStory(mockStory as any);
      stateManager.dispatch(new InitializeStoryAction());
      stateManager.dispatch(new StartStoryAction());
      stateManager.dispatch(
        new AddStoryEventsAction([
          { type: "text", text: "Event before choice", tags: [] },
        ])
      );
      stateManager.dispatch(
        new SetCurrentChoicesAction([
          { index: 0, text: "Choice 1", tags: [] },
          { index: 1, text: "Choice 2", tags: [] },
        ])
      );
      stateManager.dispatch(new MockSelectChoiceAction(0));
      stateManager.dispatch(
        new AddStoryEventsAction([
          { type: "text", text: "Event after choice", tags: [] },
        ])
      );

      // Execute
      const state = stateManager.rewindToLastChoice();

      // Assert
      expect(state).toEqual(
        mockPreviewState({
          isStart: true,
          storyEvents: [
            {
              type: "text",
              text: "Event before choice",
              tags: [],
              isCurrent: true,
            },
          ],
          currentChoices: [
            { index: 0, text: "Choice 1", tags: [] },
            { index: 1, text: "Choice 2", tags: [] },
          ],
          lastChoiceIndex: 1,
        })
      );
    });

    it("should rewind to beginning when no choice selections exist", () => {
      // Set up
      stateManager.dispatch(new StartStoryAction());
      stateManager.dispatch(
        new AddStoryEventsAction([{ type: "text", text: "Event", tags: [] }])
      );
      stateManager.dispatch(new EndStoryAction());

      // Execute
      const state = stateManager.rewindToLastChoice();

      // Assert
      expect(state).toEqual(mockPreviewState());
      expect(stateManager.getHistory()).toHaveLength(0);
    });

    it("should handle multiple choice selections", () => {
      // Set up
      const mockStory = { ResetState: jest.fn() };
      stateManager.setStory(mockStory as any);
      stateManager.dispatch(new StartStoryAction());
      stateManager.dispatch(
        new AddStoryEventsAction([{ type: "text", text: "Event 1", tags: [] }])
      );
      stateManager.dispatch(
        new SetCurrentChoicesAction([
          { index: 0, text: "First Choice", tags: [] },
        ])
      );
      stateManager.dispatch(new MockSelectChoiceAction(0));
      stateManager.dispatch(
        new AddStoryEventsAction([{ type: "text", text: "Event 2", tags: [] }])
      );
      stateManager.dispatch(
        new SetCurrentChoicesAction([
          { index: 0, text: "Second Choice", tags: [] },
        ])
      );
      stateManager.dispatch(new MockSelectChoiceAction(0));
      stateManager.dispatch(
        new AddStoryEventsAction([{ type: "text", text: "Event 3", tags: [] }])
      );

      // Execute - should rewind to LAST SelectChoiceAction
      const state = stateManager.rewindToLastChoice();

      // Assert
      expect(state).toEqual(
        mockPreviewState({
          isStart: true,
          storyEvents: [
            { type: "text", text: "Event 1", tags: [], isCurrent: false },
            {
              type: "text",
              text: "Selected choice 0",
              tags: [],
              isCurrent: true,
            },
            { type: "text", text: "Event 2", tags: [], isCurrent: true },
          ],
          currentChoices: [{ index: 0, text: "Second Choice", tags: [] }],
          lastChoiceIndex: 3,
          uiState: { rewind: true },
        })
      );
    });

    it("should work with empty history", () => {
      // Execute
      const state = stateManager.rewindToLastChoice();

      // Assert
      expect(state).toEqual(mockPreviewState());
      expect(stateManager.getHistory()).toHaveLength(0);
    });
  });
});
