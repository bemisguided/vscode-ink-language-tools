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
    test("should add a single event to empty storyEvents", () => {
      // Arrange
      const newEvent: StoryEvent = {
        type: "text",
        text: "Hello, world!",
        tags: ["greeting"],
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
      expect(newState.storyEvents[0]).toEqual(newEvent);
    });

    test("should add multiple events to empty storyEvents", () => {
      // Arrange
      const newEvents: StoryEvent[] = [
        {
          type: "text",
          text: "First text",
          tags: ["tag1"],
        },
        {
          type: "function",
          functionName: "testFunc",
          args: ["arg1", 123],
          result: "result",
        },
        {
          type: "text",
          text: "Second text",
          tags: [],
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
      expect(newState.storyEvents).toEqual(newEvents);
    });

    test("should append events to existing storyEvents", () => {
      // Arrange
      const existingEvents: StoryEvent[] = [
        {
          type: "text",
          text: "Existing text",
          tags: ["existing"],
        },
      ];
      const newEvents: StoryEvent[] = [
        {
          type: "function",
          functionName: "newFunc",
          args: [],
          result: null,
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
      expect(newState.storyEvents[0]).toEqual(existingEvents[0]);
      expect(newState.storyEvents[1]).toEqual(newEvents[0]);
    });

    test("should handle empty events array", () => {
      // Arrange
      const existingEvents: StoryEvent[] = [
        {
          type: "text",
          text: "Existing text",
          tags: [],
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
      expect(newState.storyEvents).toEqual(existingEvents);
    });

    test("should preserve all other state properties unchanged", () => {
      // Arrange
      const newEvent: StoryEvent = {
        type: "text",
        text: "New text",
        tags: ["new"],
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
      expect(newState.storyEvents[0]).toEqual(newEvent);
    });

    test("should not mutate the original state", () => {
      // Arrange
      const originalEvents: StoryEvent[] = [
        {
          type: "text",
          text: "Original text",
          tags: ["original"],
        },
      ];
      const newEvents: StoryEvent[] = [
        {
          type: "text",
          text: "New text",
          tags: ["new"],
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

      // New state should have both events
      expect(newState.storyEvents).toHaveLength(2);
      expect(newState.storyEvents[0]).toEqual(originalEvents[0]);
      expect(newState.storyEvents[1]).toEqual(newEvents[0]);
    });

    test("should handle different event types", () => {
      // Arrange
      const textEvent: StoryEvent = {
        type: "text",
        text: "Some story text",
        tags: ["story", "text"],
      };
      const functionEvent: StoryEvent = {
        type: "function",
        functionName: "calculateScore",
        args: [100, "bonus"],
        result: 150,
      };
      const functionEventWithNullResult: StoryEvent = {
        type: "function",
        functionName: "doSomething",
        args: [],
        result: null,
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
      expect(newState.storyEvents[0]).toEqual(textEvent);
      expect(newState.storyEvents[1]).toEqual(functionEvent);
      expect(newState.storyEvents[2]).toEqual(functionEventWithNullResult);
    });

    test("should handle events with complex content", () => {
      // Arrange
      const complexEvents: StoryEvent[] = [
        {
          type: "text",
          text: "Text with\nnewlines\tand\ttabs and special chars: àáâãäåæçèéêë",
          tags: ["complex", "unicode", "àáâãäåæçèéêë"],
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
      expect(newState.storyEvents).toEqual(complexEvents);
    });

    test("should maintain chronological order of events", () => {
      // Arrange
      const existingEvents: StoryEvent[] = [
        {
          type: "text",
          text: "First",
          tags: ["1"],
        },
        {
          type: "text",
          text: "Second",
          tags: ["2"],
        },
      ];
      const newEvents: StoryEvent[] = [
        {
          type: "text",
          text: "Third",
          tags: ["3"],
        },
        {
          type: "text",
          text: "Fourth",
          tags: ["4"],
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
    });
  });
});
