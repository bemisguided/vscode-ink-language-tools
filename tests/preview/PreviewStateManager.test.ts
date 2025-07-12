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
      expect(state.storyEvents).toEqual([]);
      expect(state.currentChoices).toEqual([]);
      expect(state.errors).toEqual([]);
      expect(state.isEnded).toBe(false);
      expect(state.isStart).toBe(false);
      expect(state.metadata.title).toBe("Untitled Story");
      expect(state.metadata.fileName).toBe("unknown.ink");
    });

    it("should create with partial initial state", () => {
      // Setup
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
      expect(state.metadata.title).toBe("Custom Story");
      expect(state.metadata.fileName).toBe("custom.ink");
      expect(state.isStart).toBe(true);
      expect(state.storyEvents).toEqual([]);
      expect(state.currentChoices).toEqual([]);
      expect(state.errors).toEqual([]);
      expect(state.isEnded).toBe(false);

      customStateManager.dispose();
    });

    it("should merge metadata properly with overrides", () => {
      // Setup
      const customStateManager = new PreviewStateManager({
        metadata: {
          title: "Custom Story",
          fileName: "custom.ink",
        },
      });

      // Execute
      const state = customStateManager.getState();

      // Assert
      expect(state.metadata.title).toBe("Custom Story");
      expect(state.metadata.fileName).toBe("custom.ink");

      customStateManager.dispose();
    });
  });

  describe("Action Dispatching", () => {
    it("should dispatch StartStoryAction", () => {
      // Setup
      stateManager.dispatch(
        new AddStoryEventsAction([
          { type: "text", text: "Test event", tags: [] },
        ])
      );
      const action = new StartStoryAction();

      // Execute
      const newState = stateManager.dispatch(action);

      // Assert
      expect(newState.storyEvents).toEqual([]);
      expect(newState.currentChoices).toEqual([]);
      expect(newState.errors).toEqual([]);
      expect(newState.isEnded).toBe(false);
      expect(newState.isStart).toBe(true);
      expect(stateManager.getState()).toEqual(newState);
    });

    it("should dispatch EndStoryAction", () => {
      // Setup
      const action = new EndStoryAction();

      // Execute
      const newState = stateManager.dispatch(action);

      // Assert
      expect(newState.isEnded).toBe(true);
      expect(newState.isStart).toBe(false);
      expect(stateManager.getState()).toEqual(newState);
    });

    it("should dispatch AddStoryEventsAction", () => {
      // Setup
      const events: StoryEvent[] = [
        { type: "text", text: "Event 1", tags: ["tag1"] },
        { type: "function", functionName: "testFunc", args: [1], result: 2 },
      ];
      const action = new AddStoryEventsAction(events);

      // Execute
      const newState = stateManager.dispatch(action);

      // Assert
      // Events should have isCurrent: true added by AddStoryEventsAction
      const expectedEvents = [
        { type: "text", text: "Event 1", tags: ["tag1"], isCurrent: true },
        {
          type: "function",
          functionName: "testFunc",
          args: [1],
          result: 2,
          isCurrent: true,
        },
      ];
      expect(newState.storyEvents).toEqual(expectedEvents);
      expect(newState.storyEvents).toHaveLength(2);
      expect(stateManager.getState()).toEqual(newState);
    });

    it("should dispatch SetCurrentChoicesAction", () => {
      // Setup
      const choices: Choice[] = [
        { index: 0, text: "Choice 1", tags: ["choice"] },
        { index: 1, text: "Choice 2", tags: [] },
      ];
      const action = new SetCurrentChoicesAction(choices);

      // Execute
      const newState = stateManager.dispatch(action);

      // Assert
      expect(newState.currentChoices).toEqual(choices);
      expect(newState.currentChoices).toHaveLength(2);
      expect(stateManager.getState()).toEqual(newState);
    });

    it("should dispatch AddErrorsAction", () => {
      // Setup
      const errors: ErrorInfo[] = [
        { message: "Error 1", severity: "error" },
        { message: "Warning 1", severity: "warning" },
      ];
      const action = new AddErrorsAction(errors);

      // Execute
      const newState = stateManager.dispatch(action);

      // Assert
      expect(newState.errors).toEqual(errors);
      expect(newState.errors).toHaveLength(2);
      expect(stateManager.getState()).toEqual(newState);
    });

    it("should dispatch ClearErrorsAction", () => {
      // Setup
      stateManager.dispatch(
        new AddErrorsAction([{ message: "Error to clear", severity: "error" }])
      );
      const action = new ClearErrorsAction();

      // Execute
      const newState = stateManager.dispatch(action);

      // Assert
      expect(newState.errors).toEqual([]);
      expect(stateManager.getState()).toEqual(newState);
    });

    it("should return new state after each dispatch", () => {
      // Setup
      const initialState = stateManager.getState();
      const action = new StartStoryAction();

      // Execute
      const newState = stateManager.dispatch(action);

      // Assert
      expect(newState).not.toBe(initialState);
      expect(newState.isStart).toBe(true);
      expect(initialState.isStart).toBe(false);
    });
  });

  describe("State Access", () => {
    it("should return current state", () => {
      // Execute
      const state = stateManager.getState();

      // Assert
      expect(state).toBeDefined();
      expect(state.storyEvents).toEqual([]);
      expect(state.currentChoices).toEqual([]);
      expect(state.errors).toEqual([]);
      expect(state.isEnded).toBe(false);
      expect(state.isStart).toBe(false);
      expect(state.metadata).toBeDefined();
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
      // Setup
      const initialState = stateManager.getState();
      expect(initialState.isStart).toBe(false);

      // Execute
      stateManager.dispatch(new StartStoryAction());
      const updatedState = stateManager.getState();

      // Assert
      expect(updatedState.isStart).toBe(true);
      expect(initialState.isStart).toBe(false); // Original should be unchanged
    });
  });

  describe("State Immutability", () => {
    it("should not mutate state when dispatching actions", () => {
      // Setup
      const initialState = stateManager.getState();
      const initialStateCopy = JSON.parse(JSON.stringify(initialState));

      // Execute
      stateManager.dispatch(new StartStoryAction());

      // Assert
      expect(initialState).toEqual(initialStateCopy);
    });

    it("should maintain immutability across multiple dispatches", () => {
      // Setup
      const states: PreviewState[] = [];
      states.push(stateManager.getState());

      // Execute
      stateManager.dispatch(new StartStoryAction());
      states.push(stateManager.getState());

      stateManager.dispatch(
        new AddStoryEventsAction([{ type: "text", text: "Event", tags: [] }])
      );
      states.push(stateManager.getState());

      stateManager.dispatch(
        new SetCurrentChoicesAction([{ index: 0, text: "Choice", tags: [] }])
      );
      states.push(stateManager.getState());

      // Assert
      expect(states[0].isStart).toBe(false);
      expect(states[1].isStart).toBe(true);
      expect(states[1].storyEvents).toHaveLength(0);
      expect(states[2].storyEvents).toHaveLength(1);
      expect(states[2].currentChoices).toHaveLength(0);
      expect(states[3].currentChoices).toHaveLength(1);
    });
  });

  describe("Reset Functionality", () => {
    it("should reset to default state", () => {
      // Setup
      stateManager.dispatch(new StartStoryAction());
      stateManager.dispatch(
        new AddStoryEventsAction([{ type: "text", text: "Event", tags: [] }])
      );
      stateManager.dispatch(
        new AddErrorsAction([{ message: "Error", severity: "error" }])
      );

      // Execute
      stateManager.reset();

      // Assert
      const state = stateManager.getState();
      expect(state.storyEvents).toEqual([]);
      expect(state.currentChoices).toEqual([]);
      expect(state.errors).toEqual([]);
      expect(state.isEnded).toBe(false);
      expect(state.isStart).toBe(false);
    });

    it("should preserve metadata when resetting", () => {
      // Setup - Create state manager with custom metadata
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
      const state = customStateManager.getState();
      expect(state.metadata.title).toBe("Custom Story");
      expect(state.metadata.fileName).toBe("custom.ink");
      expect(state.storyEvents).toEqual([]);
      expect(state.isStart).toBe(false);

      customStateManager.dispose();
    });
  });

  describe("Dispose Functionality", () => {
    it("should dispose and clear state", () => {
      // Setup
      stateManager.dispatch(new StartStoryAction());
      stateManager.dispatch(
        new AddStoryEventsAction([{ type: "text", text: "Event", tags: [] }])
      );

      // Execute
      stateManager.dispose();

      // Assert
      const state = stateManager.getState();
      expect(state.storyEvents).toEqual([]);
      expect(state.currentChoices).toEqual([]);
      expect(state.errors).toEqual([]);
      expect(state.isEnded).toBe(false);
      expect(state.isStart).toBe(false);
      expect(state.metadata.title).toBe("Untitled Story");
      expect(state.metadata.fileName).toBe("unknown.ink");
    });
  });

  describe("Complex State Workflows", () => {
    it("should handle complete story workflow", () => {
      // Setup - Use state manager with custom metadata
      const customStateManager = new PreviewStateManager({
        metadata: {
          title: "Test Story",
          fileName: "test.ink",
        },
      });

      // Execute - Run complete workflow
      customStateManager.dispatch(new StartStoryAction());
      let state = customStateManager.getState();
      expect(state.isStart).toBe(true);
      expect(state.isEnded).toBe(false);

      customStateManager.dispatch(
        new AddStoryEventsAction([
          { type: "text", text: "Welcome to the story", tags: [] },
          {
            type: "text",
            text: "You find yourself in a room",
            tags: ["location"],
          },
        ])
      );
      state = customStateManager.getState();
      expect(state.storyEvents).toHaveLength(2);

      customStateManager.dispatch(
        new SetCurrentChoicesAction([
          { index: 0, text: "Go left", tags: [] },
          { index: 1, text: "Go right", tags: [] },
        ])
      );
      state = customStateManager.getState();
      expect(state.currentChoices).toHaveLength(2);

      customStateManager.dispatch(
        new AddStoryEventsAction([
          { type: "text", text: "You chose to go left", tags: [] },
        ])
      );
      state = customStateManager.getState();
      expect(state.storyEvents).toHaveLength(3);

      customStateManager.dispatch(new EndStoryAction());
      state = customStateManager.getState();

      // Assert - Final state verification
      expect(state.isEnded).toBe(true);
      expect(state.isStart).toBe(false);
      expect(state.metadata.title).toBe("Test Story");
      expect(state.metadata.fileName).toBe("test.ink");
      expect(state.storyEvents).toHaveLength(3);
      expect(state.currentChoices).toHaveLength(2);

      customStateManager.dispose();
    });

    it("should handle error scenarios", () => {
      // Setup - Add errors during story
      stateManager.dispatch(
        new AddErrorsAction([
          { message: "Runtime error", severity: "error" },
          { message: "Warning message", severity: "warning" },
        ])
      );

      // Execute - Continue story and clear errors
      let state = stateManager.getState();
      expect(state.errors).toHaveLength(2);

      stateManager.dispatch(
        new AddStoryEventsAction([
          { type: "text", text: "Story continues despite errors", tags: [] },
        ])
      );
      state = stateManager.getState();
      expect(state.errors).toHaveLength(2);
      expect(state.storyEvents).toHaveLength(1);

      stateManager.dispatch(new ClearErrorsAction());
      state = stateManager.getState();

      // Assert
      expect(state.errors).toHaveLength(0);
      expect(state.storyEvents).toHaveLength(1); // Events should remain
    });

    it("should handle restart scenario", () => {
      // Setup - Create story with full state and custom metadata
      const customStateManager = new PreviewStateManager({
        metadata: {
          title: "Test Story",
          fileName: "test.ink",
        },
      });
      customStateManager.dispatch(
        new AddStoryEventsAction([
          { type: "text", text: "Story event", tags: [] },
        ])
      );
      customStateManager.dispatch(
        new SetCurrentChoicesAction([{ index: 0, text: "Choice", tags: [] }])
      );
      customStateManager.dispatch(
        new AddErrorsAction([{ message: "Error", severity: "error" }])
      );

      // Execute - Restart using StartStoryAction
      customStateManager.dispatch(new StartStoryAction());

      // Assert
      const state = customStateManager.getState();
      expect(state.storyEvents).toEqual([]);
      expect(state.currentChoices).toEqual([]);
      expect(state.errors).toEqual([]);
      expect(state.isEnded).toBe(false);
      expect(state.isStart).toBe(true);
      expect(state.metadata.title).toBe("Test Story"); // Preserved
      expect(state.metadata.fileName).toBe("test.ink"); // Preserved

      customStateManager.dispose();
    });
  });
});
