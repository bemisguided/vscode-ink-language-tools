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
import {
  PreviewState,
  PreviewStoryState,
  StoryEvent,
} from "../../../src/preview/PreviewState";
import {
  mockPreviewState,
  mockPreviewStoryState,
} from "../../__mocks__/mockPreviewState";

describe("AddStoryEventsAction", () => {
  function setupState(
    events: StoryEvent[] = [],
    story: PreviewStoryState = mockPreviewStoryState()
  ): PreviewState {
    return {
      ...mockPreviewState(),
      story: {
        ...story,
        events,
      },
    };
  }

  describe("apply", () => {
    test("should add a single event to empty storyEvents as current", () => {
      // Setup
      const newEvent: StoryEvent = {
        type: "text",
        text: "Hello, world!",
        tags: ["greeting"],
      };
      const action = new AddStoryEventsAction([newEvent]);
      const currentState: PreviewState = setupState([], {
        ...mockPreviewStoryState(),
        events: [],
        lastChoiceIndex: 0,
      });

      // Execute
      const newState = action.apply(currentState);

      // Assert
      expect(newState.story.events).toHaveLength(1);
      expect(newState.story.events[0]).toEqual({
        ...newEvent,
        isCurrent: true,
      });
    });

    test("should add multiple events to empty storyEvents as current", () => {
      // Set up
      const newEvent1: StoryEvent = {
        type: "text",
        text: "First event",
        tags: ["first"],
      };
      const newEvent2: StoryEvent = {
        type: "function",
        functionName: "testFunc",
        args: [1, 2],
        result: 3,
      };
      const newEvents: StoryEvent[] = [newEvent1, newEvent2];
      const action = new AddStoryEventsAction(newEvents);
      const currentState: PreviewState = setupState([], {
        ...mockPreviewStoryState(),
        events: [],
        lastChoiceIndex: 0,
      });

      // Execute
      const newState = action.apply(currentState);

      // Assert
      expect(newState.story.events).toHaveLength(2);
      expect(newState.story.events[0]).toEqual({
        ...newEvent1,
        isCurrent: true,
      });
      expect(newState.story.events[1]).toEqual({
        ...newEvent2,
        isCurrent: true,
      });
    });

    test("should append events to existing storyEvents", () => {
      // Setup
      const existingEvent: StoryEvent = {
        type: "text",
        text: "Existing event",
        tags: ["existing"],
      };
      const existingEvents: StoryEvent[] = [
        {
          ...existingEvent,
          isCurrent: false,
        },
      ];
      const newEvent: StoryEvent = {
        type: "text",
        text: "New event",
        tags: ["new"],
      };
      const newEvents: StoryEvent[] = [newEvent];
      const action = new AddStoryEventsAction(newEvents);
      const currentState: PreviewState = setupState(existingEvents, {
        ...mockPreviewStoryState(),
        events: existingEvents,
        lastChoiceIndex: 1,
      });

      // Execute
      const newState = action.apply(currentState);

      // Assert
      expect(newState.story.events).toHaveLength(2);
      expect(newState.story.events[0]).toEqual({
        ...existingEvent,
        isCurrent: false,
      });
      expect(newState.story.events[1]).toEqual({
        ...newEvent,
        isCurrent: true,
      });
    });

    test("should mark events as current when index >= lastChoiceIndex", () => {
      // Setup
      const existingEvent1: StoryEvent = {
        type: "text",
        text: "Old event 1",
        tags: [],
        isCurrent: false,
      };
      const existingEvent2: StoryEvent = {
        type: "text",
        text: "Old event 2",
        tags: [],
        isCurrent: false,
      };
      const existingEvents: StoryEvent[] = [existingEvent1, existingEvent2];
      const newEvent: StoryEvent = {
        type: "text",
        text: "New event",
        tags: [],
      };
      const newEvents: StoryEvent[] = [newEvent];
      const action = new AddStoryEventsAction(newEvents);
      const currentState: PreviewState = setupState(existingEvents, {
        ...mockPreviewStoryState(),
        events: existingEvents,
        lastChoiceIndex: 1, // Second event onwards should be current
      });

      // Execute
      const newState = action.apply(currentState);

      // Assert
      expect(newState.story.events).toHaveLength(3);
      expect(newState.story.events[0]).toEqual({
        ...existingEvent1,
        isCurrent: false,
      });
      expect(newState.story.events[1]).toEqual({
        ...existingEvent2,
        isCurrent: true,
      });
      expect(newState.story.events[2]).toEqual({
        ...newEvent,
        isCurrent: true,
      });
    });

    test("should preserve all other state properties", () => {
      // Set up
      const newEvent: StoryEvent = {
        type: "text" as const,
        text: "Test event",
        tags: ["test"],
      };
      const action = new AddStoryEventsAction([newEvent]);
      const currentState: PreviewState = setupState([], {
        ...mockPreviewStoryState(),
        events: [],
        choices: [
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
      const newState = action.apply(currentState);

      // Assert
      expect(newState.story.choices).toEqual(currentState.story.choices);
      expect(newState.story.errors).toEqual(currentState.story.errors);
      expect(newState.story.isEnded).toBe(true);
      expect(newState.story.isStart).toBe(false);
      expect(newState.story.lastChoiceIndex).toBe(0);
    });

    test("should handle empty events array", () => {
      // Setup
      const existingEvent: StoryEvent = {
        type: "text",
        text: "Existing event",
        tags: [],
        isCurrent: false,
      };
      const action = new AddStoryEventsAction([]);
      const currentState: PreviewState = setupState([existingEvent]);

      // Execute
      const newState = action.apply(currentState);

      // Assert
      expect(newState.story.events).toHaveLength(1);
      expect(newState.story.events[0]).toEqual({
        ...existingEvent,
        isCurrent: true,
      });
    });
  });
});
