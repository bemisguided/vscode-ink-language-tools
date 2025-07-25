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
import { PreviewAction } from "../../src/preview/PreviewAction";
import { PreviewState } from "../../src/preview/PreviewState";
import { PreviewStoryManager } from "../../src/preview/PreviewStoryManager";

// Import shared mocks
import { mockPreviewState } from "../__mocks__/mockPreviewState";

// Purpose-built mock action classes that implement the PreviewAction interface
class MockPreviewAction implements PreviewAction {
  public readonly type: string;
  public readonly historical: boolean;
  public readonly apply: jest.Mock;
  public readonly effect: jest.Mock;

  constructor(
    type: string = "MOCK_ACTION",
    historical: boolean = true,
    customApply?: jest.Mock,
    customEffect?: jest.Mock
  ) {
    this.type = type;
    this.historical = historical;
    this.apply = customApply || jest.fn().mockReturnValue(mockPreviewState());
    this.effect = customEffect || jest.fn();
  }
}

const createMockAction = (
  type?: string,
  historical?: boolean,
  customApply?: jest.Mock,
  customEffect?: jest.Mock
): MockPreviewAction => {
  return new MockPreviewAction(type, historical, customApply, customEffect);
};

// Mock PreviewStoryManager for tests
const createMockStoryManager = (): jest.Mocked<PreviewStoryManager> => {
  return {
    reset: jest.fn(),
    continue: jest.fn().mockReturnValue({
      events: [],
      choices: [],
      isEnded: false,
      errors: [],
    }),
    selectChoice: jest.fn().mockReturnValue({
      events: [],
      choices: [],
      isEnded: false,
      errors: [],
    }),
    isEnded: jest.fn().mockReturnValue(false),
    canContinue: jest.fn().mockReturnValue(true),
    getCurrentChoices: jest.fn().mockReturnValue([]),
  } as any; // Use 'as any' to bypass strict type checking for the mock
};

describe("PreviewStateManager", () => {
  let stateManager: PreviewStateManager;
  let mockStoryManager: jest.Mocked<PreviewStoryManager>;

  beforeEach(() => {
    // Setup: Create fresh state manager and mock story manager for each test
    mockStoryManager = createMockStoryManager();
    stateManager = new PreviewStateManager();
    stateManager.storyManager = mockStoryManager;
  });

  afterEach(() => {
    jest.clearAllMocks();
    stateManager?.dispose();
  });

  describe(".constructor()", () => {
    test("should initialize with default state", () => {
      // Setup: Default constructor

      // Execute
      const state = stateManager.getState();

      // Assert
      expect(state).toEqual(mockPreviewState());
    });

    test("should initialize empty history", () => {
      // Setup: Default constructor

      // Execute
      const history = stateManager.getHistory();

      // Assert
      expect(history).toEqual([]);
    });

    test("should store the provided story manager", () => {
      // Setup: Constructor with mock story manager

      // Execute
      const mockAction = createMockAction("TEST_ACTION");
      stateManager.dispatch(mockAction);

      // Assert
      expect(mockAction.effect).toHaveBeenCalledWith(
        expect.objectContaining({
          storyManager: mockStoryManager,
        })
      );
    });
  });

  describe(".dispatch()", () => {
    test("should call action apply method with current state", () => {
      // Setup
      const mockAction = createMockAction(
        "TEST_ACTION",
        true,
        jest.fn().mockImplementation((draft) => {
          draft.story.isStart = false;
        })
      );

      // Execute
      stateManager.dispatch(mockAction);

      // Assert
      expect(mockAction.apply).toHaveBeenCalledTimes(1);
    });

    test("should call action effect method with correct context", () => {
      // Setup
      const mockAction = createMockAction("TEST_ACTION");

      // Execute
      stateManager.dispatch(mockAction);

      // Assert
      expect(mockAction.effect).toHaveBeenCalledTimes(1);
      expect(mockAction.effect).toHaveBeenCalledWith(
        expect.objectContaining({
          getState: expect.any(Function),
          dispatch: expect.any(Function),
          storyManager: mockStoryManager,
          sendStoryState: expect.any(Function),
          undo: expect.any(Function),
          undoToLast: expect.any(Function),
        })
      );
    });

    test("should only add actions to history when the action is historical", () => {
      // Setup
      const historicalAction = createMockAction("ACTION_1", true);
      const nonHistoricalAction = createMockAction("ACTION_2", false);

      // Execute
      stateManager.dispatch(historicalAction);
      stateManager.dispatch(nonHistoricalAction);

      // Assert
      const history = stateManager.getHistory();
      expect(history).toHaveLength(1);
      expect(history[0].action).toBe(historicalAction);
    });

    test("should return updated state after action execution", () => {
      // Setup
      const newState = mockPreviewState({ story: { isStart: false } });
      const mockAction = createMockAction(
        "TEST_ACTION",
        true,
        jest.fn().mockImplementation((draft) => {
          draft.story.isStart = false;
        })
      );

      // Execute
      const returnedState = stateManager.dispatch(mockAction);

      // Assert
      expect(returnedState).toEqual(newState);
      expect(stateManager.getState()).toEqual(newState);
    });

    test("should handle action execution errors", () => {
      // Setup
      const errorAction = createMockAction(
        "ERROR_ACTION",
        true,
        jest.fn().mockImplementation(() => {
          throw new Error("Test error");
        })
      );

      // Execute & Assert
      expect(() => stateManager.dispatch(errorAction)).toThrow("Test error");
    });

    test("should return immutable state", () => {
      // Setup
      const mockAction = createMockAction("TEST_ACTION");

      // Execute
      const updatedState = stateManager.dispatch(mockAction);

      // Assert
      expect(() => (updatedState.story.isStart = false)).toThrow(
        "Cannot assign to read only property 'isStart' of object '#<Object>'"
      );
    });

    test("should send state change notification when a single action is dispatched", () => {
      // Setup
      const mockAction = createMockAction("TEST_ACTION");
      const stateChangeCallback = jest.fn();
      stateManager.setOnStateChange(stateChangeCallback);

      // Execute
      const updatedState = stateManager.dispatch(mockAction);

      // Assert
      expect(stateChangeCallback).toHaveBeenCalledTimes(1);
      expect(stateChangeCallback).toHaveBeenCalledWith(updatedState);
    });

    test("should send state change notification when the stack of actions has been processed", () => {
      // Setup
      const mockAction1 = createMockAction(
        "TEST_ACTION1",
        true,
        jest.fn().mockImplementation((draft) => {
          draft.story.isEnded = true;
        })
      );
      const mockAction2 = createMockAction(
        "TEST_ACTION2",
        true,
        jest.fn().mockImplementation((draft) => {
          draft.story.isStart = false;
        }),
        jest.fn().mockImplementation((context) => {
          context.dispatch(mockAction1);
        })
      );
      const stateChangeCallback = jest.fn();
      stateManager.setOnStateChange(stateChangeCallback);

      // Execute
      const updatedState = stateManager.dispatch(mockAction2);

      // Assert
      expect(mockAction1.effect).toHaveBeenCalledTimes(1);
      expect(mockAction2.effect).toHaveBeenCalledTimes(1);
      expect(updatedState.story.isEnded).toBe(true);
      expect(updatedState.story.isStart).toBe(false);
      expect(stateChangeCallback).toHaveBeenCalledTimes(1);
      expect(stateChangeCallback).toHaveBeenCalledWith(updatedState);
    });
  });

  describe(".getState()", () => {
    test("should return current state", () => {
      // Setup: Default state

      // Execute
      const state = stateManager.getState();

      // Assert
      expect(state).toEqual(mockPreviewState());
    });

    test("should return copy not reference", () => {
      // Setup: Default state

      // Execute
      const state1 = stateManager.getState();
      const state2 = stateManager.getState();

      // Assert
      expect(state1).toEqual(state2);
    });

    test("should return immutable state", () => {
      // Setup: Default state

      // Execute
      const state = stateManager.getState();
      expect(() => (state.story.isStart = false)).toThrow(
        "Cannot assign to read only property 'isStart' of object '#<Object>'"
      );
    });

    test("should reflect state changes after action dispatch", () => {
      // Setup
      const mockAction = createMockAction(
        "MODIFY_STATE",
        true,
        jest.fn().mockImplementation((draft) => {
          draft.story.isStart = false;
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

  describe(".getHistory()", () => {
    test("should return empty array initially", () => {
      // Setup: Fresh state manager

      // Execute
      const history = stateManager.getHistory();

      // Assert
      expect(history).toEqual([]);
    });

    test("should return copy of history array", () => {
      // Setup
      stateManager.dispatch(createMockAction());

      // Execute
      const history1 = stateManager.getHistory();
      const history2 = stateManager.getHistory();

      // Assert
      expect(history1).not.toBe(history2);
      expect(history1).toEqual(history2);
    });

    test("should track actions in order", () => {
      // Setup
      const action1 = createMockAction("ACTION_1");
      const action2 = createMockAction("ACTION_2");

      // Execute
      stateManager.dispatch(action1);
      stateManager.dispatch(action2);
      const history = stateManager.getHistory();

      // Assert
      expect(history).toHaveLength(2);
      expect(history[0].action).toBe(action1);
      expect(history[1].action).toBe(action2);
    });
  });

  describe(".replay()", () => {
    test("should replay all actions when no index provided", () => {
      // Setup
      const action1 = createMockAction("ACTION_1");
      const action2 = createMockAction("ACTION_2");
      stateManager.dispatch(action1);
      stateManager.dispatch(action2);

      // Clear call counts for replay test
      action1.apply.mockClear();
      action2.apply.mockClear();

      // Execute
      const replayedState = stateManager.replay();

      // Assert
      expect(action1.apply).toHaveBeenCalledTimes(1);
      expect(action2.apply).toHaveBeenCalledTimes(1);
      expect(replayedState).toEqual(stateManager.getState());
    });

    test("should replay actions up to specified index", () => {
      // Setup
      const action1 = createMockAction("ACTION_1");
      const action2 = createMockAction("ACTION_2");
      const action3 = createMockAction("ACTION_3");
      stateManager.dispatch(action1);
      stateManager.dispatch(action2);
      stateManager.dispatch(action3);

      // Clear call counts for replay test
      action1.apply.mockClear();
      action2.apply.mockClear();
      action3.apply.mockClear();

      // Execute - replay only first action (up to index 1)
      stateManager.replay(1);

      // Assert
      expect(action1.apply).toHaveBeenCalledTimes(1);
      expect(action2.apply).not.toHaveBeenCalled();
      expect(action3.apply).not.toHaveBeenCalled();
    });

    test("should throw error for invalid replay index", () => {
      // Setup
      stateManager.dispatch(createMockAction("ACTION_1"));

      // Execute & Assert
      expect(() => stateManager.replay(-1)).toThrow("Invalid replay index: -1");
      expect(() => stateManager.replay(5)).toThrow("Invalid replay index: 5");
    });
  });

  describe(".undo()", () => {
    test("should replay to one action before current", () => {
      // Setup
      const action1 = createMockAction("ACTION_1");
      const action2 = createMockAction("ACTION_2");
      stateManager.dispatch(action1);
      stateManager.dispatch(action2);

      // Clear call counts for undo test
      action1.apply.mockClear();
      action2.apply.mockClear();

      // Execute
      const undoState = stateManager.undo();

      // Assert
      expect(action1.apply).toHaveBeenCalledTimes(1);
      expect(action2.apply).not.toHaveBeenCalled();
    });

    test("should return current state when no history", () => {
      // Setup: No actions dispatched

      // Execute
      const undoState = stateManager.undo();

      // Assert
      expect(undoState).toEqual(stateManager.getState());
    });
  });

  describe(".undoToLast()", () => {
    test("should replay to last occurrence of specified action type", () => {
      // Setup
      const action1 = createMockAction("START_STORY");
      const action2 = createMockAction("ADD_STORY_EVENTS");
      const action3 = createMockAction("SET_CURRENT_CHOICES");
      const action4 = createMockAction("ADD_STORY_EVENTS");

      stateManager.dispatch(action1);
      stateManager.dispatch(action2);
      stateManager.dispatch(action3);
      stateManager.dispatch(action4);

      // Clear call counts for undo test
      [action1, action2, action3, action4].forEach((a) => a.apply.mockClear());

      // Execute - undo to last ADD_STORY_EVENTS (action4)
      const undoState = stateManager.undoToLast("ADD_STORY_EVENTS");

      // Assert - replay up to (but not including) last ADD_STORY_EVENTS (action4)
      expect(action1.apply).toHaveBeenCalledTimes(1);
      expect(action2.apply).toHaveBeenCalledTimes(1);
      expect(action3.apply).toHaveBeenCalledTimes(1);
      expect(action4.apply).not.toHaveBeenCalled(); // Should not include the last occurrence
    });

    test("should replay to beginning when action type not found", () => {
      // Setup
      const action1 = createMockAction("START_STORY");
      stateManager.dispatch(action1);

      // Clear call counts for undo test
      action1.apply.mockClear();

      // Execute
      const undoState = stateManager.undoToLast("NONEXISTENT_ACTION");

      // Assert - should replay to beginning (index 0)
      expect(action1.apply).not.toHaveBeenCalled();
      expect(undoState).toEqual(stateManager.getState());
    });
  });

  describe(".reset()", () => {
    test("should clear all history", () => {
      // Setup
      stateManager.dispatch(createMockAction("ACTION_1"));
      stateManager.dispatch(createMockAction("ACTION_2"));
      expect(stateManager.getHistory()).toHaveLength(2);

      // Execute
      stateManager.reset();

      // Assert
      expect(stateManager.getHistory()).toEqual([]);
    });

    test("should reset state to default", () => {
      // Setup
      const modifiedState = mockPreviewState({
        story: { isStart: false, isEnded: true },
      });
      const modifyAction = createMockAction(
        "MODIFY_STATE",
        true,
        jest.fn().mockReturnValue(modifiedState)
      );
      stateManager.dispatch(modifyAction);

      // Execute
      stateManager.reset();
      const state = stateManager.getState();

      // Assert
      expect(state).toEqual(mockPreviewState());
    });
  });

  describe(".setOnStateChange()", () => {
    test("should call callback when state changes", () => {
      // Setup
      const callback = jest.fn();
      const initialState = stateManager.getState();

      // Execute
      stateManager.setOnStateChange(callback);
      stateManager.sendState();

      // Assert
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(initialState);
    });

    test("should not call callback when no callback set", () => {
      // Setup: No callback set
      // Execute & Assert
      expect(() => stateManager.sendState()).not.toThrow();
    });
  });

  describe(".sendState()", () => {
    test("should call onStateChange callback when set", () => {
      // Setup
      const callback = jest.fn();
      const initialState = stateManager.getState();
      stateManager.setOnStateChange(callback);

      // Execute
      stateManager.sendState();

      // Assert
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenCalledWith(initialState);
    });

    test("should not throw when no callback set", () => {
      // Setup: No callback set

      // Execute & Assert
      expect(() => stateManager.sendState()).not.toThrow();
    });
  });

  describe(".dispose()", () => {
    test("should clear all state and history", () => {
      // Setup
      stateManager.dispatch(createMockAction("ACTION_1"));
      const initialHistory = stateManager.getHistory();
      expect(initialHistory).toHaveLength(1);

      // Execute
      stateManager.dispose();

      // Assert
      const finalHistory = stateManager.getHistory();
      expect(finalHistory).toEqual([]);
      expect(stateManager.getState()).toEqual(mockPreviewState());
    });

    test("should not throw when called multiple times", () => {
      // Setup: Default state manager

      // Execute & Assert
      expect(() => {
        stateManager.dispose();
        stateManager.dispose();
      }).not.toThrow();
    });
  });
});
