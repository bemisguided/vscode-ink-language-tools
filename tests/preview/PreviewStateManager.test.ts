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
import { ErrorInfo } from "../../src/preview/ErrorInfo";

// Import all actions
import { StartStoryAction } from "../../src/preview/actions/StartStoryAction";
import { EndStoryAction } from "../../src/preview/actions/EndStoryAction";
import { AddStoryEventsAction } from "../../src/preview/actions/AddStoryEventsAction";
import { SetCurrentChoicesAction } from "../../src/preview/actions/SetCurrentChoicesAction";
import { AddErrorsAction } from "../../src/preview/actions/AddErrorsAction";
import { ClearErrorsAction } from "../../src/preview/actions/ClearErrorsAction";

// Import mock helpers
import { mockPreviewState } from "../__mocks__/mockPreviewState";

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
        metadata: {
          title: "Custom Story",
          fileName: "custom.ink",
        },
        isStart: true,
      });

      // Execute
      const state = customStateManager.getState();

      // Assert
      expect(state).toEqual(
        mockPreviewState({
          metadata: {
            title: "Custom Story",
            fileName: "custom.ink",
          },
          isStart: true,
        })
      );

      customStateManager.dispose();
    });

    it("should merge metadata properly with overrides", () => {
      // Set up
      const customStateManager = new PreviewStateManager({
        metadata: {
          title: "Custom Story",
          fileName: "custom.ink",
        },
      });

      // Execute
      const state = customStateManager.getState();

      // Assert
      expect(state).toEqual(
        mockPreviewState({
          metadata: {
            title: "Custom Story",
            fileName: "custom.ink",
          },
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

    it("should preserve metadata when resetting", () => {
      // Set up - Create state manager with custom metadata
      const customStateManager = new PreviewStateManager({
        metadata: {
          title: "Custom Story",
          fileName: "custom.ink",
        },
      });
      customStateManager.dispatch(new StartStoryAction());
      customStateManager.dispatch(
        new AddStoryEventsAction([{ type: "text", text: "Event", tags: [] }])
      );

      // Execute
      customStateManager.reset();

      // Assert
      expect(customStateManager.getState()).toEqual(
        mockPreviewState({
          metadata: {
            title: "Custom Story",
            fileName: "custom.ink",
          },
        })
      );

      customStateManager.dispose();
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
});
