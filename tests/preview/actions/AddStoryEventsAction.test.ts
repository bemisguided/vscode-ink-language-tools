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

import { AddStoryEventsAction } from "../../../src/preview/actions/AddStoryEventsAction";
import { PreviewState } from "../../../src/preview/PreviewState";
import { StoryEvent } from "../../../src/preview/PreviewState";
import { mockPreviewState } from "../../__mocks__/mockPreviewState";

describe("AddStoryEventsAction", () => {
  describe("reduce", () => {
    test("should add a single event to empty storyEvents as current", () => {
      // Set up
      const newEvent: StoryEvent = {
        type: "text" as const,
        text: "Hello, world!",
        tags: ["greeting"],
        isCurrent: false, // This will be overridden based on lastChoiceIndex
      };
      const action = new AddStoryEventsAction([newEvent]);
      const currentState: PreviewState = mockPreviewState({
        storyEvents: [],
        lastChoiceIndex: 0,
      });

      // Execute
      const newState = action.reduce(currentState);

      // Assert
      expect(newState.storyEvents).toHaveLength(1);
      expect(newState.storyEvents[0]).toEqual({
        type: "text",
        text: "Hello, world!",
        tags: ["greeting"],
        isCurrent: true,
      });
    });

    test("should add multiple events to empty storyEvents as current", () => {
      // Set up
      const newEvents: StoryEvent[] = [
        {
          type: "text" as const,
          text: "First event",
          tags: ["first"],
        },
        {
          type: "function" as const,
          functionName: "testFunc",
          args: [1, 2],
          result: 3,
        },
      ];
      const action = new AddStoryEventsAction(newEvents);
      const currentState: PreviewState = mockPreviewState({
        storyEvents: [],
        lastChoiceIndex: 0,
      });

      // Execute
      const newState = action.reduce(currentState);

      // Assert
      expect(newState.storyEvents).toHaveLength(2);
      expect(newState.storyEvents[0]).toEqual({
        type: "text",
        text: "First event",
        tags: ["first"],
        isCurrent: true,
      });
      expect(newState.storyEvents[1]).toEqual({
        type: "function",
        functionName: "testFunc",
        args: [1, 2],
        result: 3,
        isCurrent: true,
      });
    });

    test("should append events to existing storyEvents", () => {
      // Set up
      const existingEvents: StoryEvent[] = [
        {
          type: "text" as const,
          text: "Existing event",
          tags: ["existing"],
          isCurrent: false,
        },
      ];
      const newEvents: StoryEvent[] = [
        {
          type: "text" as const,
          text: "New event",
          tags: ["new"],
        },
      ];
      const action = new AddStoryEventsAction(newEvents);
      const currentState: PreviewState = mockPreviewState({
        storyEvents: existingEvents,
        lastChoiceIndex: 1,
      });

      // Execute
      const newState = action.reduce(currentState);

      // Assert
      expect(newState.storyEvents).toHaveLength(2);
      expect(newState.storyEvents[0]).toEqual({
        type: "text",
        text: "Existing event",
        tags: ["existing"],
        isCurrent: false,
      });
      expect(newState.storyEvents[1]).toEqual({
        type: "text",
        text: "New event",
        tags: ["new"],
        isCurrent: true,
      });
    });

    test("should mark events as current when index >= lastChoiceIndex", () => {
      // Set up
      const existingEvents: StoryEvent[] = [
        {
          type: "text" as const,
          text: "Old event 1",
          tags: [],
          isCurrent: false,
        },
        {
          type: "text" as const,
          text: "Old event 2",
          tags: [],
          isCurrent: false,
        },
      ];
      const newEvents: StoryEvent[] = [
        {
          type: "text" as const,
          text: "New event",
          tags: [],
        },
      ];
      const action = new AddStoryEventsAction(newEvents);
      const currentState: PreviewState = mockPreviewState({
        storyEvents: existingEvents,
        lastChoiceIndex: 1, // Second event onwards should be current
      });

      // Execute
      const newState = action.reduce(currentState);

      // Assert
      expect(newState.storyEvents).toHaveLength(3);
      expect(newState.storyEvents[0].isCurrent).toBe(false);
      expect(newState.storyEvents[1].isCurrent).toBe(true);
      expect(newState.storyEvents[2].isCurrent).toBe(true);
    });

    test("should preserve all other state properties", () => {
      // Set up
      const newEvent: StoryEvent = {
        type: "text" as const,
        text: "Test event",
        tags: ["test"],
      };
      const action = new AddStoryEventsAction([newEvent]);
      const currentState: PreviewState = mockPreviewState({
        storyEvents: [],
        currentChoices: [
          {
            index: 0,
            text: "Choice 1",
            tags: ["choice"],
          },
        ],
        errors: [
          {
            message: "Test error",
            severity: "error",
          },
        ],
        isEnded: true,
        isStart: false,
        lastChoiceIndex: 0,
      });

      // Execute
      const newState = action.reduce(currentState);

      // Assert
      expect(newState.currentChoices).toEqual(currentState.currentChoices);
      expect(newState.errors).toEqual(currentState.errors);
      expect(newState.isEnded).toBe(true);
      expect(newState.isStart).toBe(false);
      expect(newState.lastChoiceIndex).toBe(0);
    });

    test("should handle empty events array", () => {
      // Set up
      const action = new AddStoryEventsAction([]);
      const currentState: PreviewState = mockPreviewState({
        storyEvents: [
          {
            type: "text" as const,
            text: "Existing event",
            tags: [],
            isCurrent: false,
          },
        ],
        lastChoiceIndex: 0, // Event at index 0 will be marked as current
      });

      // Execute
      const newState = action.reduce(currentState);

      // Assert
      expect(newState.storyEvents).toHaveLength(1);
      expect(newState.storyEvents[0]).toEqual({
        type: "text",
        text: "Existing event",
        tags: [],
        isCurrent: true, // Should be current since index 0 >= lastChoiceIndex 0
      });
    });

    test("should return a new state object", () => {
      // Set up
      const newEvent: StoryEvent = {
        type: "text" as const,
        text: "Test event",
        tags: [],
      };
      const action = new AddStoryEventsAction([newEvent]);
      const currentState: PreviewState = mockPreviewState();

      // Execute
      const newState = action.reduce(currentState);

      // Assert
      expect(newState).not.toBe(currentState);
      expect(newState).toEqual(
        mockPreviewState({
          storyEvents: [
            {
              type: "text",
              text: "Test event",
              tags: [],
              isCurrent: true,
            },
          ],
        })
      );
    });
  });

  describe("Edge cases", () => {
    test("should handle events with special characters", () => {
      // Set up
      const specialEvent: StoryEvent = {
        type: "text" as const,
        text: "Event with special chars: àáâãäåæçèéêë 🔥💥",
        tags: ["special", "unicode"],
      };
      const action = new AddStoryEventsAction([specialEvent]);
      const currentState: PreviewState = mockPreviewState();

      // Execute
      const newState = action.reduce(currentState);

      // Assert
      expect(newState.storyEvents).toHaveLength(1);
      expect(newState.storyEvents[0]).toEqual({
        type: "text",
        text: "Event with special chars: àáâãäåæçèéêë 🔥💥",
        tags: ["special", "unicode"],
        isCurrent: true,
      });
    });

    test("should handle function events with complex args", () => {
      // Set up
      const complexFunctionEvent: StoryEvent = {
        type: "function" as const,
        functionName: "complexFunction",
        args: [
          { nested: "object" },
          ["array", "of", "strings"],
          42,
          true,
          null,
        ],
        result: { success: true, value: 100 },
      };
      const action = new AddStoryEventsAction([complexFunctionEvent]);
      const currentState: PreviewState = mockPreviewState();

      // Execute
      const newState = action.reduce(currentState);

      // Assert
      expect(newState.storyEvents).toHaveLength(1);
      expect(newState.storyEvents[0]).toEqual({
        type: "function",
        functionName: "complexFunction",
        args: [
          { nested: "object" },
          ["array", "of", "strings"],
          42,
          true,
          null,
        ],
        result: { success: true, value: 100 },
        isCurrent: true,
      });
    });

    test("should handle mixed event types", () => {
      // Set up
      const mixedEvents: StoryEvent[] = [
        {
          type: "text" as const,
          text: "Text event",
          tags: ["text"],
        },
        {
          type: "function" as const,
          functionName: "testFunc",
          args: [1, 2, 3],
          result: 6,
        },
        {
          type: "text" as const,
          text: "Another text event",
          tags: ["text", "another"],
        },
      ];
      const action = new AddStoryEventsAction(mixedEvents);
      const currentState: PreviewState = mockPreviewState();

      // Execute
      const newState = action.reduce(currentState);

      // Assert
      expect(newState.storyEvents).toHaveLength(3);
      expect(newState.storyEvents[0].type).toBe("text");
      expect(newState.storyEvents[1].type).toBe("function");
      expect(newState.storyEvents[2].type).toBe("text");
      expect(newState.storyEvents.every((event) => event.isCurrent)).toBe(true);
    });
  });
});
