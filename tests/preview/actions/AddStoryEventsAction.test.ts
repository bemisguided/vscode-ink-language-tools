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
import { StoryEvent } from "../../../src/preview/types";

describe("AddStoryEventsAction", () => {
  describe("reduce", () => {
    test("should add a single event to empty storyEvents as current", () => {
      // Arrange
      const newEvent: StoryEvent = {
        type: "text",
        text: "Hello, world!",
        tags: ["greeting"],
        isCurrent: false, // This will be overridden to true by the action
      };
      const action = new AddStoryEventsAction([newEvent]);
      const currentState: PreviewState = {
        storyEvents: [],
        currentChoices: [],
        errors: [],
        isEnded: false,
        isStart: false,
        metadata: {
          title: "Test Story",
          fileName: "/path/to/test.ink",
        },
      };

      // Act
      const newState = action.reduce(currentState);

      // Assert
      expect(newState.storyEvents).toHaveLength(1);
      expect(newState.storyEvents[0]).toEqual({
        ...newEvent,
        isCurrent: true,
      });
    });

    test("should add multiple events to empty storyEvents as current", () => {
      // Arrange
      const newEvents: StoryEvent[] = [
        {
          type: "text",
          text: "First text",
          tags: ["tag1"],
          isCurrent: false, // Will be overridden to true
        },
        {
          type: "function",
          functionName: "testFunc",
          args: ["arg1", 123],
          result: "result",
          isCurrent: false, // Will be overridden to true
        },
        {
          type: "text",
          text: "Second text",
          tags: [],
          isCurrent: false, // Will be overridden to true
        },
      ];
      const action = new AddStoryEventsAction(newEvents);
      const currentState: PreviewState = {
        storyEvents: [],
        currentChoices: [],
        errors: [],
        isEnded: false,
        isStart: false,
        metadata: {
          title: "Test Story",
          fileName: "/path/to/test.ink",
        },
      };

      // Act
      const newState = action.reduce(currentState);

      // Assert
      expect(newState.storyEvents).toHaveLength(3);
      newState.storyEvents.forEach((event, index) => {
        expect(event).toEqual({
          ...newEvents[index],
          isCurrent: true,
        });
      });
    });

    test("should mark existing events as historical and new events as current", () => {
      // Arrange
      const existingEvents: StoryEvent[] = [
        {
          type: "text",
          text: "Existing text",
          tags: ["existing"],
          isCurrent: true, // Currently current, will become historical
        },
      ];
      const newEvents: StoryEvent[] = [
        {
          type: "function",
          functionName: "newFunc",
          args: [],
          result: null,
          isCurrent: false, // Will be overridden to true
        },
      ];
      const action = new AddStoryEventsAction(newEvents);
      const currentState: PreviewState = {
        storyEvents: existingEvents,
        currentChoices: [],
        errors: [],
        isEnded: false,
        isStart: false,
        metadata: {
          title: "Test Story",
          fileName: "/path/to/test.ink",
        },
      };

      // Act
      const newState = action.reduce(currentState);

      // Assert
      expect(newState.storyEvents).toHaveLength(2);
      // First event should be marked as historical
      expect(newState.storyEvents[0]).toEqual({
        ...existingEvents[0],
        isCurrent: false,
      });
      // Second event should be marked as current
      expect(newState.storyEvents[1]).toEqual({
        ...newEvents[0],
        isCurrent: true,
      });
    });

    test("should handle empty events array without changing existing events", () => {
      // Arrange
      const existingEvents: StoryEvent[] = [
        {
          type: "text",
          text: "Existing text",
          tags: [],
          isCurrent: true, // Should remain unchanged when no new events
        },
      ];
      const action = new AddStoryEventsAction([]);
      const currentState: PreviewState = {
        storyEvents: existingEvents,
        currentChoices: [],
        errors: [],
        isEnded: false,
        isStart: false,
        metadata: {
          title: "Test Story",
          fileName: "/path/to/test.ink",
        },
      };

      // Act
      const newState = action.reduce(currentState);

      // Assert
      expect(newState.storyEvents).toHaveLength(1);
      expect(newState.storyEvents[0]).toEqual({
        ...existingEvents[0],
        isCurrent: false, // Should be marked as historical even with empty array
      });
    });

    test("should preserve all other state properties unchanged", () => {
      // Arrange
      const newEvent: StoryEvent = {
        type: "text",
        text: "New text",
        tags: ["new"],
        isCurrent: false,
      };
      const action = new AddStoryEventsAction([newEvent]);
      const currentState: PreviewState = {
        storyEvents: [],
        currentChoices: [
          {
            index: 0,
            text: "Choice 1",
            tags: ["choice-tag"],
          },
        ],
        errors: [
          {
            message: "Error message",
            severity: "error",
          },
        ],
        isEnded: true,
        isStart: false,
        metadata: {
          title: "My Story",
          fileName: "/path/to/story.ink",
        },
      };

      // Act
      const newState = action.reduce(currentState);

      // Assert
      expect(newState.currentChoices).toEqual(currentState.currentChoices);
      expect(newState.errors).toEqual(currentState.errors);
      expect(newState.isEnded).toBe(true);
      expect(newState.isStart).toBe(false);
      expect(newState.metadata).toEqual(currentState.metadata);
      expect(newState.storyEvents).toHaveLength(1);
      expect(newState.storyEvents[0]).toEqual({
        ...newEvent,
        isCurrent: true,
      });
    });

    test("should not mutate the original state", () => {
      // Arrange
      const originalEvents: StoryEvent[] = [
        {
          type: "text",
          text: "Original text",
          tags: ["original"],
          isCurrent: true,
        },
      ];
      const newEvents: StoryEvent[] = [
        {
          type: "text",
          text: "New text",
          tags: ["new"],
          isCurrent: false,
        },
      ];
      const action = new AddStoryEventsAction(newEvents);
      const currentState: PreviewState = {
        storyEvents: originalEvents,
        currentChoices: [],
        errors: [],
        isEnded: false,
        isStart: false,
        metadata: {
          title: "Test Story",
          fileName: "/path/to/test.ink",
        },
      };

      // Act
      const newState = action.reduce(currentState);

      // Assert - original state should be unchanged
      expect(currentState.storyEvents).toHaveLength(1);
      expect(currentState.storyEvents[0]).toEqual(originalEvents[0]);

      // New state should have both events with correct isCurrent values
      expect(newState.storyEvents).toHaveLength(2);
      expect(newState.storyEvents[0]).toEqual({
        ...originalEvents[0],
        isCurrent: false,
      });
      expect(newState.storyEvents[1]).toEqual({
        ...newEvents[0],
        isCurrent: true,
      });
    });

    test("should handle different event types", () => {
      // Arrange
      const textEvent: StoryEvent = {
        type: "text",
        text: "Some story text",
        tags: ["story", "text"],
        isCurrent: false,
      };
      const functionEvent: StoryEvent = {
        type: "function",
        functionName: "calculateScore",
        args: [100, "bonus"],
        result: 150,
        isCurrent: false,
      };
      const functionEventWithNullResult: StoryEvent = {
        type: "function",
        functionName: "doSomething",
        args: [],
        result: null,
        isCurrent: false,
      };
      const action = new AddStoryEventsAction([
        textEvent,
        functionEvent,
        functionEventWithNullResult,
      ]);
      const currentState: PreviewState = {
        storyEvents: [],
        currentChoices: [],
        errors: [],
        isEnded: false,
        isStart: false,
        metadata: {
          title: "Test Story",
          fileName: "/path/to/test.ink",
        },
      };

      // Act
      const newState = action.reduce(currentState);

      // Assert
      expect(newState.storyEvents).toHaveLength(3);
      expect(newState.storyEvents[0]).toEqual({
        ...textEvent,
        isCurrent: true,
      });
      expect(newState.storyEvents[1]).toEqual({
        ...functionEvent,
        isCurrent: true,
      });
      expect(newState.storyEvents[2]).toEqual({
        ...functionEventWithNullResult,
        isCurrent: true,
      });
    });

    test("should handle events with complex content", () => {
      // Arrange
      const complexEvents: StoryEvent[] = [
        {
          type: "text",
          text: "Text with\nnewlines\tand\ttabs and special chars: àáâãäåæçèéêë",
          tags: ["complex", "unicode", "àáâãäåæçèéêë"],
          isCurrent: false,
        },
        {
          type: "function",
          functionName: "complexFunction",
          args: ["string with spaces", 42, true, null, undefined],
          result: {
            complex: "object",
            with: ["nested", "arrays"],
            and: { nested: "objects" },
          },
          isCurrent: false,
        },
      ];
      const action = new AddStoryEventsAction(complexEvents);
      const currentState: PreviewState = {
        storyEvents: [],
        currentChoices: [],
        errors: [],
        isEnded: false,
        isStart: false,
        metadata: {
          title: "Test Story",
          fileName: "/path/to/test.ink",
        },
      };

      // Act
      const newState = action.reduce(currentState);

      // Assert
      expect(newState.storyEvents).toHaveLength(2);
      expect(newState.storyEvents).toEqual([
        { ...complexEvents[0], isCurrent: true },
        { ...complexEvents[1], isCurrent: true },
      ]);
    });

    test("should maintain chronological order of events", () => {
      // Arrange
      const existingEvents: StoryEvent[] = [
        {
          type: "text",
          text: "First",
          tags: ["1"],
          isCurrent: true,
        },
        {
          type: "text",
          text: "Second",
          tags: ["2"],
          isCurrent: true,
        },
      ];
      const newEvents: StoryEvent[] = [
        {
          type: "text",
          text: "Third",
          tags: ["3"],
          isCurrent: false,
        },
        {
          type: "text",
          text: "Fourth",
          tags: ["4"],
          isCurrent: false,
        },
      ];
      const action = new AddStoryEventsAction(newEvents);
      const currentState: PreviewState = {
        storyEvents: existingEvents,
        currentChoices: [],
        errors: [],
        isEnded: false,
        isStart: false,
        metadata: {
          title: "Test Story",
          fileName: "/path/to/test.ink",
        },
      };

      // Act
      const newState = action.reduce(currentState);

      // Assert
      expect(newState.storyEvents).toHaveLength(4);
      expect((newState.storyEvents[0] as any).tags).toEqual(["1"]);
      expect((newState.storyEvents[1] as any).tags).toEqual(["2"]);
      expect((newState.storyEvents[2] as any).tags).toEqual(["3"]);
      expect((newState.storyEvents[3] as any).tags).toEqual(["4"]);

      // Verify isCurrent values
      expect(newState.storyEvents[0].isCurrent).toBe(false); // Historical
      expect(newState.storyEvents[1].isCurrent).toBe(false); // Historical
      expect(newState.storyEvents[2].isCurrent).toBe(true); // Current
      expect(newState.storyEvents[3].isCurrent).toBe(true); // Current
    });

    test("should handle multiple historical and current groups", () => {
      // Arrange
      const existingEvents: StoryEvent[] = [
        {
          type: "text",
          text: "First group - historical",
          tags: ["group1"],
          isCurrent: false,
        },
        {
          type: "text",
          text: "Second group - current",
          tags: ["group2"],
          isCurrent: true,
        },
      ];
      const newEvents: StoryEvent[] = [
        {
          type: "text",
          text: "Third group - will be current",
          tags: ["group3"],
          isCurrent: false,
        },
      ];
      const action = new AddStoryEventsAction(newEvents);
      const currentState: PreviewState = {
        storyEvents: existingEvents,
        currentChoices: [],
        errors: [],
        isEnded: false,
        isStart: false,
        metadata: {
          title: "Test Story",
          fileName: "/path/to/test.ink",
        },
      };

      // Act
      const newState = action.reduce(currentState);

      // Assert
      expect(newState.storyEvents).toHaveLength(3);
      // All existing events should become historical
      expect(newState.storyEvents[0].isCurrent).toBe(false);
      expect(newState.storyEvents[1].isCurrent).toBe(false);
      // New events should be current
      expect(newState.storyEvents[2].isCurrent).toBe(true);
    });
  });
});
