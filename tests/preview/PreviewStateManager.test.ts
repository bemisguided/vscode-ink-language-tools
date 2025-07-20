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
import { StoryAction } from "../../src/preview/StoryAction";
import { UIAction } from "../../src/preview/actions/UIAction";
import { StoryActionContext } from "../../src/preview/StoryActionContext";

// Import shared mocks
import { mockPreviewState } from "../__mocks__/mockPreviewState";
import { mockStoryState } from "../__mocks__/mockStoryState";
import { mockUIState } from "../__mocks__/mockUIState";

// Purpose-built mock action classes that actually implement the interfaces
class MockStoryAction implements StoryAction {
  public readonly category = "story" as const;
  public readonly type: string;
  public readonly apply: jest.Mock;

  constructor(type: string = "MOCK_STORY_ACTION", customApply?: jest.Mock) {
    this.type = type;
    this.apply = customApply || jest.fn();
  }
}

class MockUIAction implements UIAction {
  public readonly category = "ui" as const;
  public readonly type: string;
  public readonly apply: jest.Mock;
  public readonly payload?: any;

  constructor(
    type: string = "MOCK_UI_ACTION",
    customApply?: jest.Mock,
    payload?: any
  ) {
    this.type = type;
    this.apply = customApply || jest.fn();
    this.payload = payload;
  }
}

const createMockStoryAction = (
  type?: string,
  customApply?: jest.Mock
): MockStoryAction => {
  return new MockStoryAction(type, customApply);
};

const createMockUIAction = (
  type?: string,
  customApply?: jest.Mock,
  payload?: any
): MockUIAction => {
  return new MockUIAction(type, customApply, payload);
};

describe("PreviewStateManager", () => {
  let stateManager: PreviewStateManager;

  beforeEach(() => {
    // Setup: Create fresh state manager for each test
    stateManager = new PreviewStateManager();
  });

  afterEach(() => {
    jest.clearAllMocks();
    stateManager?.dispose();
  });

  describe(".constructor()", () => {
    test("should initialize with default state", () => {
      // Setup
      // Default constructor

      // Execute
      const state = stateManager.getState();

      // Assert
      expect(state).toEqual(mockPreviewState());
    });

    test("should initialize with provided state overrides", () => {
      // Setup
      const customState = mockPreviewState({
        story: { isStart: false, isEnded: true },
      });

      // Execute
      const customStateManager = new PreviewStateManager(customState);
      const state = customStateManager.getState();

      // Assert
      expect(state).toEqual(
        mockPreviewState({
          story: { isStart: false, isEnded: true },
        })
      );

      customStateManager.dispose();
    });

    test("should initialize empty history arrays", () => {
      // Setup
      // Default constructor

      // Execute
      const storyHistory = stateManager.getStoryHistory();
      const uiHistory = stateManager.getUIHistory();

      // Assert
      expect(storyHistory).toEqual([]);
      expect(uiHistory).toEqual([]);
    });
  });

  describe(".dispatch()", () => {
    test("should call story action apply method with correct context", () => {
      // Setup
      const mockAction = createMockStoryAction("TEST_STORY_ACTION");

      // Execute
      stateManager.dispatch(mockAction);

      // Assert
      expect(mockAction.apply).toHaveBeenCalledTimes(1);
      expect(mockAction.apply).toHaveBeenCalledWith(
        expect.objectContaining({
          getState: expect.any(Function),
          setState: expect.any(Function),
        })
      );
    });

    test("should call UI action apply method with correct context", () => {
      // Setup
      const mockAction = createMockUIAction("TEST_UI_ACTION");

      // Execute
      stateManager.dispatch(mockAction);

      // Assert
      expect(mockAction.apply).toHaveBeenCalledTimes(1);
      expect(mockAction.apply).toHaveBeenCalledWith(
        expect.objectContaining({
          getState: expect.any(Function),
          setState: expect.any(Function),
        })
      );
    });

    test("should add story actions to story history only", () => {
      // Setup
      const storyAction = createMockStoryAction("STORY_ACTION");
      const uiAction = createMockUIAction("UI_ACTION");

      // Execute
      stateManager.dispatch(storyAction);
      stateManager.dispatch(uiAction);

      // Assert
      expect(stateManager.getStoryHistory()).toHaveLength(1);
      expect(stateManager.getUIHistory()).toHaveLength(1);
      expect(stateManager.getStoryHistory()[0].action).toBe(storyAction);
      expect(stateManager.getUIHistory()[0].action).toBe(uiAction);
    });

    test("should return updated state after action execution", () => {
      // Setup
      const mockAction = createMockStoryAction("TEST_ACTION");

      // Execute
      const returnedState = stateManager.dispatch(mockAction);
      const currentState = stateManager.getState();

      // Assert
      expect(returnedState).toEqual(currentState);
    });

    test("should handle action execution errors", () => {
      // Setup
      const errorAction = createMockStoryAction(
        "ERROR_ACTION",
        jest.fn().mockImplementation(() => {
          throw new Error("Test error");
        })
      );

      // Execute & Assert
      expect(() => stateManager.dispatch(errorAction)).toThrow("Test error");
    });
  });

  describe(".getState()", () => {
    test("should return current state", () => {
      // Setup
      // Default state

      // Execute
      const state = stateManager.getState();

      // Assert
      expect(state).toEqual(mockPreviewState());
    });

    test("should return copy not reference", () => {
      // Setup
      // Default state

      // Execute
      const state1 = stateManager.getState();
      const state2 = stateManager.getState();

      // Assert
      expect(state1).not.toBe(state2);
      expect(state1).toEqual(state2);
    });

    test("should reflect state changes after action dispatch", () => {
      // Setup
      const mockAction = createMockStoryAction(
        "MODIFY_STATE",
        jest.fn().mockImplementation((context: StoryActionContext) => {
          const currentState = context.getState();
          context.setState({ ...currentState, isStart: false });
        })
      );

      // Execute
      const initialState = stateManager.getState();
      stateManager.dispatch(mockAction);
      const updatedState = stateManager.getState();

      // Assert
      expect(initialState.story.isStart).toBe(true);
      expect(updatedState.story.isStart).toBe(false);
    });
  });

  describe(".getStoryState()", () => {
    test("should return current story state", () => {
      // Setup
      // Default state

      // Execute
      const storyState = stateManager.getStoryState();

      // Assert
      expect(storyState).toEqual(mockStoryState());
    });

    test("should return copy not reference", () => {
      // Setup
      // Default state

      // Execute
      const state1 = stateManager.getStoryState();
      const state2 = stateManager.getStoryState();

      // Assert
      expect(state1).not.toBe(state2);
      expect(state1).toEqual(state2);
    });
  });

  describe(".getUIState()", () => {
    test("should return current UI state", () => {
      // Setup
      // Default state

      // Execute
      const uiState = stateManager.getUIState();

      // Assert
      expect(uiState).toEqual(mockUIState());
    });

    test("should return copy not reference", () => {
      // Setup
      // Default state

      // Execute
      const state1 = stateManager.getUIState();
      const state2 = stateManager.getUIState();

      // Assert
      expect(state1).not.toBe(state2);
      expect(state1).toEqual(state2);
    });
  });

  describe(".getStoryHistory()", () => {
    test("should return empty array initially", () => {
      // Setup
      // Fresh state manager

      // Execute
      const history = stateManager.getStoryHistory();

      // Assert
      expect(history).toEqual([]);
    });

    test("should return copy of history array", () => {
      // Setup
      stateManager.dispatch(createMockStoryAction());

      // Execute
      const history1 = stateManager.getStoryHistory();
      const history2 = stateManager.getStoryHistory();

      // Assert
      expect(history1).not.toBe(history2);
      expect(history1).toEqual(history2);
    });

    test("should track story actions in order", () => {
      // Setup
      const action1 = createMockStoryAction("ACTION_1");
      const action2 = createMockStoryAction("ACTION_2");

      // Execute
      stateManager.dispatch(action1);
      stateManager.dispatch(action2);
      const history = stateManager.getStoryHistory();

      // Assert
      expect(history).toHaveLength(2);
      expect(history[0].action).toBe(action1);
      expect(history[1].action).toBe(action2);
    });

    test("should not include UI actions", () => {
      // Setup
      const storyAction = createMockStoryAction("STORY_ACTION");
      const uiAction = createMockUIAction("UI_ACTION");

      // Execute
      stateManager.dispatch(storyAction);
      stateManager.dispatch(uiAction);
      const storyHistory = stateManager.getStoryHistory();

      // Assert
      expect(storyHistory).toHaveLength(1);
      expect(storyHistory[0].action).toBe(storyAction);
    });
  });

  describe(".getUIHistory()", () => {
    test("should return empty array initially", () => {
      // Setup
      // Fresh state manager

      // Execute
      const history = stateManager.getUIHistory();

      // Assert
      expect(history).toEqual([]);
    });

    test("should return copy of history array", () => {
      // Setup
      stateManager.dispatch(createMockUIAction());

      // Execute
      const history1 = stateManager.getUIHistory();
      const history2 = stateManager.getUIHistory();

      // Assert
      expect(history1).not.toBe(history2);
      expect(history1).toEqual(history2);
    });

    test("should track UI actions in order", () => {
      // Setup
      const action1 = createMockUIAction("UI_ACTION_1");
      const action2 = createMockUIAction("UI_ACTION_2");

      // Execute
      stateManager.dispatch(action1);
      stateManager.dispatch(action2);
      const history = stateManager.getUIHistory();

      // Assert
      expect(history).toHaveLength(2);
      expect(history[0].action).toBe(action1);
      expect(history[1].action).toBe(action2);
    });

    test("should not include story actions", () => {
      // Setup
      const storyAction = createMockStoryAction("STORY_ACTION");
      const uiAction = createMockUIAction("UI_ACTION");

      // Execute
      stateManager.dispatch(storyAction);
      stateManager.dispatch(uiAction);
      const uiHistory = stateManager.getUIHistory();

      // Assert
      expect(uiHistory).toHaveLength(1);
      expect(uiHistory[0].action).toBe(uiAction);
    });
  });

  describe(".replayStoryState()", () => {
    test("should replay all actions when no index provided", () => {
      // Setup
      const action1 = createMockStoryAction("ACTION_1");
      const action2 = createMockStoryAction("ACTION_2");
      stateManager.dispatch(action1);
      stateManager.dispatch(action2);

      // Clear call counts for replay test
      action1.apply.mockClear();
      action2.apply.mockClear();

      // Execute
      const replayedState = stateManager.replayStoryState();

      // Assert
      expect(action1.apply).toHaveBeenCalledTimes(1);
      expect(action2.apply).toHaveBeenCalledTimes(1);
      expect(replayedState).toEqual(stateManager.getState());
    });

    test("should replay actions up to specified index", () => {
      // Setup
      const action1 = createMockStoryAction("ACTION_1");
      const action2 = createMockStoryAction("ACTION_2");
      const action3 = createMockStoryAction("ACTION_3");
      stateManager.dispatch(action1);
      stateManager.dispatch(action2);
      stateManager.dispatch(action3);

      // Clear call counts for replay test
      action1.apply.mockClear();
      action2.apply.mockClear();
      action3.apply.mockClear();

      // Execute - replay only first action (up to index 1)
      stateManager.replayStoryState(1);

      // Assert
      expect(action1.apply).toHaveBeenCalledTimes(1);
      expect(action2.apply).not.toHaveBeenCalled();
      expect(action3.apply).not.toHaveBeenCalled();
    });
  });

  describe(".undoStoryState()", () => {
    test("should replay to one action before current", () => {
      // Setup
      const action1 = createMockStoryAction("ACTION_1");
      const action2 = createMockStoryAction("ACTION_2");
      stateManager.dispatch(action1);
      stateManager.dispatch(action2);

      // Clear call counts for undo test
      action1.apply.mockClear();
      action2.apply.mockClear();

      // Execute
      const undoState = stateManager.undoStoryState();

      // Assert
      expect(action1.apply).toHaveBeenCalledTimes(1);
      expect(action2.apply).not.toHaveBeenCalled();
    });

    test("should return current state when no history", () => {
      // Setup
      // No actions dispatched

      // Execute
      const undoState = stateManager.undoStoryState();

      // Assert
      expect(undoState).toEqual(stateManager.getState());
    });
  });

  describe(".undoStoryStateToLast()", () => {
    test("should replay to last occurrence of specified action type", () => {
      // Setup - mock story to allow story-dependent actions
      const mockStory = { isRunning: true };
      (stateManager as any).story = mockStory;
      (stateManager as any).storyManager = {};

      const action1 = createMockStoryAction("START_STORY");
      const action2 = createMockStoryAction("ADD_STORY_EVENTS");
      const action3 = createMockStoryAction("SET_CURRENT_CHOICES");
      const action4 = createMockStoryAction("ADD_STORY_EVENTS");

      stateManager.dispatch(action1);
      stateManager.dispatch(action2);
      stateManager.dispatch(action3);
      stateManager.dispatch(action4);

      // Clear call counts for undo test
      [action1, action2, action3, action4].forEach((a) => a.apply.mockClear());

      // Execute - undo to last ADD_STORY_EVENTS (action4)
      const undoState = stateManager.undoStoryStateToLast("ADD_STORY_EVENTS");

      // Assert - replay up to (but not including) last ADD_STORY_EVENTS (action4)
      expect(action1.apply).toHaveBeenCalledTimes(1);
      expect(action2.apply).toHaveBeenCalledTimes(1);
      expect(action3.apply).toHaveBeenCalledTimes(1);
      expect(action4.apply).not.toHaveBeenCalled(); // Should not include the last occurrence
    });

    test("should return current state when action type not found", () => {
      // Setup
      const action1 = createMockStoryAction("START_STORY");
      stateManager.dispatch(action1);

      // Execute
      const undoState = stateManager.undoStoryStateToLast("NONEXISTENT_ACTION");

      // Assert
      expect(undoState).toEqual(stateManager.getState());
    });
  });

  describe(".rewindStoryStateToLastChoice()", () => {
    test("should replay to last SELECT_CHOICE action", () => {
      // Setup - mock story to allow story-dependent actions
      const mockStory = { isRunning: true };
      (stateManager as any).story = mockStory;
      (stateManager as any).storyManager = {};

      const action1 = createMockStoryAction("START_STORY");
      const action2 = createMockStoryAction("SELECT_CHOICE");
      const action3 = createMockStoryAction("ADD_STORY_EVENTS");
      const action4 = createMockStoryAction("END_STORY");

      stateManager.dispatch(action1);
      stateManager.dispatch(action2);
      stateManager.dispatch(action3);
      stateManager.dispatch(action4);

      // Clear call counts for rewind test
      [action1, action2, action3, action4].forEach((a) => a.apply.mockClear());

      // Execute
      const rewindState = stateManager.rewindStoryStateToLastChoice();

      // Assert - replay up to (but not including) last SELECT_CHOICE (action2)
      expect(action1.apply).toHaveBeenCalledTimes(1);
      expect(action2.apply).not.toHaveBeenCalled(); // Should not include the SELECT_CHOICE action
      expect(action3.apply).not.toHaveBeenCalled();
      expect(action4.apply).not.toHaveBeenCalled();
    });

    test("should return current state when no choice actions", () => {
      // Setup
      const action1 = createMockStoryAction("START_STORY");
      stateManager.dispatch(action1);

      // Execute
      const rewindState = stateManager.rewindStoryStateToLastChoice();

      // Assert
      expect(rewindState).toEqual(stateManager.getState());
    });
  });

  describe(".reset()", () => {
    test("should clear all history", () => {
      // Setup
      stateManager.dispatch(createMockStoryAction());
      stateManager.dispatch(createMockUIAction());
      expect(stateManager.getStoryHistory()).toHaveLength(1);
      expect(stateManager.getUIHistory()).toHaveLength(1);

      // Execute
      stateManager.reset();

      // Assert
      expect(stateManager.getStoryHistory()).toEqual([]);
      expect(stateManager.getUIHistory()).toEqual([]);
    });

    test("should reset state to default", () => {
      // Setup
      const modifyAction = createMockStoryAction(
        "MODIFY_STATE",
        jest.fn().mockImplementation((context: StoryActionContext) => {
          context.setState(mockStoryState({ isStart: false, isEnded: true }));
        })
      );
      stateManager.dispatch(modifyAction);

      // Execute
      stateManager.reset();
      const state = stateManager.getState();

      // Assert
      expect(state).toEqual(mockPreviewState());
    });
  });

  describe(".setOnStoryStateChange()", () => {
    test("should call callback when story state changes", () => {
      // Setup
      const callback = jest.fn();
      stateManager.setOnStoryStateChange(callback);
      const mockAction = createMockStoryAction(
        "TEST_ACTION",
        jest.fn().mockImplementation((context: StoryActionContext) => {
          context.sendStoryState(); // Real actions call this
        })
      );

      // Execute
      stateManager.dispatch(mockAction);

      // Assert
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(); // No parameters in new pattern
    });

    test("should not call callback for UI actions", () => {
      // Setup
      const callback = jest.fn();
      stateManager.setOnStoryStateChange(callback);
      const mockAction = createMockUIAction();

      // Execute
      stateManager.dispatch(mockAction);

      // Assert
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe(".setOnUIStateChange()", () => {
    test("should call callback when UI state changes", () => {
      // Setup
      const callback = jest.fn();
      stateManager.setOnUIStateChange(callback);
      const mockAction = createMockUIAction(
        "TEST_UI_ACTION",
        jest.fn().mockImplementation((context: any) => {
          context.sendUIState(); // Real UI actions call this
        })
      );

      // Execute
      stateManager.dispatch(mockAction);

      // Assert
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(); // No parameters in new pattern
    });

    test("should not call callback for story actions", () => {
      // Setup
      const callback = jest.fn();
      stateManager.setOnUIStateChange(callback);
      const mockAction = createMockStoryAction();

      // Execute
      stateManager.dispatch(mockAction);

      // Assert
      expect(callback).not.toHaveBeenCalled();
    });
  });

  describe(".sendStoryState()", () => {
    test("should call onStoryStateChange callback when set", () => {
      // Setup
      const callback = jest.fn();
      stateManager.setOnStoryStateChange(callback);

      // Execute
      stateManager.sendStoryState();

      // Assert
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(); // No parameters in new pattern
    });

    test("should not throw when no callback set", () => {
      // Setup
      // No callback set

      // Execute & Assert
      expect(() => stateManager.sendStoryState()).not.toThrow();
    });
  });

  describe(".sendUIState()", () => {
    test("should call onUIStateChange callback when set", () => {
      // Setup
      const callback = jest.fn();
      stateManager.setOnUIStateChange(callback);

      // Execute
      stateManager.sendUIState();

      // Assert
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(); // No parameters in new pattern
    });

    test("should not throw when no callback set", () => {
      // Setup
      // No callback set

      // Execute & Assert
      expect(() => stateManager.sendUIState()).not.toThrow();
    });
  });

  describe(".dispose()", () => {
    test("should clear all callbacks", () => {
      // Setup
      const storyCallback = jest.fn();
      const uiCallback = jest.fn();
      stateManager.setOnStoryStateChange(storyCallback);
      stateManager.setOnUIStateChange(uiCallback);

      // Execute
      stateManager.dispose();

      // Trigger actions that would normally call callbacks
      stateManager.dispatch(createMockStoryAction());
      stateManager.dispatch(createMockUIAction());

      // Assert
      expect(storyCallback).not.toHaveBeenCalled();
      expect(uiCallback).not.toHaveBeenCalled();
    });

    test("should not throw when called multiple times", () => {
      // Setup
      // Default state manager

      // Execute & Assert
      expect(() => {
        stateManager.dispose();
        stateManager.dispose();
      }).not.toThrow();
    });
  });
});
