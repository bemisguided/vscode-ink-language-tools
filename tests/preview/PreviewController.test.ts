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

import { PreviewController } from "../../src/preview/PreviewController";
import { PreviewStoryManager } from "../../src/preview/PreviewStoryManager";
import { BuildEngine } from "../../src/build/BuildEngine";
import { MockBuildEngine } from "../__mocks__/MockBuildEngine";
import { MockWebviewPanel } from "../__mocks__/MockWebviewPanel";
import { mockVSCodeDocument } from "../__mocks__/mockVSCodeDocument";
import { createMockSuccessfulBuildResult } from "../__mocks__/mockBuildResult";
import { mockPreviewState } from "../__mocks__/mockPreviewState";

// Mock dependencies
jest.mock("../../src/build/BuildEngine");

describe("PreviewController", () => {
  let controller: PreviewController;
  let mockWebviewPanel: MockWebviewPanel;
  let mockBuildEngine: MockBuildEngine;
  let mockStoryManager: PreviewStoryManager;

  // Jest spies for webview methods
  let postMessageSpy: jest.SpyInstance;
  let onDidReceiveMessageSpy: jest.SpyInstance;

  beforeEach(() => {
    // Setup: Reset BuildEngine mock
    BuildEngine.clearInstance();
    mockBuildEngine = new MockBuildEngine();
    (BuildEngine.getInstance as jest.Mock).mockReturnValue(mockBuildEngine);

    // Setup: Create mock webview panel
    mockWebviewPanel = new MockWebviewPanel();
    postMessageSpy = jest.spyOn(mockWebviewPanel.webview, "postMessage");
    onDidReceiveMessageSpy = jest.spyOn(
      mockWebviewPanel.webview,
      "onDidReceiveMessage"
    );

    // Setup: Create controller
    controller = new PreviewController(mockWebviewPanel);

    // Setup: Create mock story manager
    const mockBuildResult = createMockSuccessfulBuildResult();
    mockStoryManager = new PreviewStoryManager(mockBuildResult.story);
  });

  afterEach(() => {
    controller.dispose();
  });

  describe("constructor", () => {
    test("should initialize webview HTML", () => {
      // Assert
      expect(mockWebviewPanel.webview.html).toContain("<!DOCTYPE html>");
      expect(mockWebviewPanel.webview.html).toContain(
        "<title>Ink Story Preview</title>"
      );
    });

    test("should set up message handlers", () => {
      // Assert
      expect(onDidReceiveMessageSpy).toHaveBeenCalled();
    });
  });

  describe("initializeWithStory", () => {
    const mockDocument = mockVSCodeDocument("story.ink", "This is the story.");

    describe("when first time", () => {
      test("should initialize story and start", async () => {
        // Setup
        // Controller is fresh, not initialized

        // Execute
        const initPromise = controller.initializeStory(mockStoryManager);
        mockWebviewPanel.webview.simulateMessage({
          command: "ready",
          payload: {},
        });
        await initPromise;

        // Assert
        expect(postMessageSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            command: "updateState",
            payload: expect.objectContaining({
              state: expect.objectContaining({
                story: expect.objectContaining({
                  isStart: true,
                }),
              }),
            }),
          })
        );
      });
    });

    describe("when ready signal is delayed", () => {
      test("should wait for ready signal", async () => {
        // Setup
        let resolveReady: () => void;
        const readyPromise = new Promise<void>((resolve) => {
          resolveReady = resolve;
        });

        // Execute
        const initPromise = controller.initializeStory(mockStoryManager);

        // Simulate delayed ready signal
        setTimeout(() => {
          mockWebviewPanel.webview.simulateMessage({
            command: "ready",
            payload: {},
          });
          resolveReady();
        }, 10);

        await Promise.all([initPromise, readyPromise]);

        // Assert
        expect(postMessageSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            command: "updateState",
          })
        );
      });
    });

    describe("when already initialized", () => {
      test("should not wait for ready signal again", async () => {
        // Setup: Initialize first time
        const firstInit = controller.initializeStory(mockStoryManager);
        mockWebviewPanel.webview.simulateMessage({
          command: "ready",
          payload: {},
        });
        await firstInit;

        // Clear previous calls
        postMessageSpy.mockClear();

        // Execute: Initialize again with new story
        await controller.initializeStory(mockStoryManager);

        // Assert: Should start immediately without waiting for ready
        expect(postMessageSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            command: "updateState",
          })
        );
      });
    });
  });

  describe("replayWithNewStory", () => {
    test("should swap story manager and replay history", async () => {
      // Setup: Initialize first
      const initPromise = controller.initializeStory(mockStoryManager);
      mockWebviewPanel.webview.simulateMessage({
        command: "ready",
        payload: {},
      });
      await initPromise;

      // Setup: Clear previous calls
      postMessageSpy.mockClear();

      // Setup: Create new story manager
      const newMockBuildResult = createMockSuccessfulBuildResult();
      const newStoryManager = new PreviewStoryManager(newMockBuildResult.story);

      // Execute
      await controller.refreshStory(newStoryManager);

      // Assert: Should have triggered state updates from replay
      expect(postMessageSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          command: "updateState",
        })
      );
    });
  });

  describe("showCompilationError", () => {
    test("should reset state and show error", async () => {
      // Execute
      await controller.showCompilationError();

      // Assert
      expect(postMessageSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          command: "updateState",
          payload: expect.objectContaining({
            state: expect.objectContaining({
              story: expect.objectContaining({
                errors: expect.arrayContaining([
                  expect.objectContaining({
                    message: expect.stringContaining("Story had errors"),
                    severity: "error",
                  }),
                ]),
              }),
            }),
          }),
        })
      );
    });
  });

  describe("message handling", () => {
    beforeEach(async () => {
      // Setup: Initialize controller first
      const initPromise = controller.initializeStory(mockStoryManager);
      mockWebviewPanel.webview.simulateMessage({
        command: "ready",
        payload: {},
      });
      await initPromise;
      postMessageSpy.mockClear();
    });

    test("should handle choice selection", () => {
      // Execute
      mockWebviewPanel.webview.simulateMessage({
        command: "action",
        payload: {
          type: "SELECT_CHOICE",
          payload: { choiceIndex: 0 },
        },
      });

      // Assert
      expect(postMessageSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          command: "updateState",
        })
      );
    });

    test("should handle story restart", () => {
      // Execute
      mockWebviewPanel.webview.simulateMessage({
        command: "action",
        payload: {
          type: "START_STORY",
        },
      });

      // Assert
      expect(postMessageSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          command: "updateState",
        })
      );
    });

    test("should handle rewind action", () => {
      // Execute
      mockWebviewPanel.webview.simulateMessage({
        command: "action",
        payload: {
          type: "REWIND_STORY",
        },
      });

      // Assert: Should trigger state update
      expect(postMessageSpy).toHaveBeenCalled();
    });

    test("should handle live update toggle", () => {
      // Execute
      mockWebviewPanel.webview.simulateMessage({
        command: "action",
        payload: {
          type: "TOGGLE_LIVE_UPDATE",
          payload: { enabled: false },
        },
      });

      // Assert
      expect(postMessageSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          command: "updateState",
        })
      );
    });
  });

  describe(".getState()", () => {
    test("should return current state from state manager", () => {
      // Setup
      const expectedState = mockPreviewState({ isEnded: true }, { canRewind: true });
      jest.spyOn(controller['stateManager'], 'getState').mockReturnValue(expectedState);

      // Execute
      const result = controller.getState();

      // Assert
      expect(result).toBe(expectedState);
      expect(controller['stateManager'].getState).toHaveBeenCalledTimes(1);
    });
  });

  describe("dispose", () => {
    test("should clean up resources", () => {
      // Execute
      controller.dispose();

      // Assert: Should not throw errors
      expect(() => controller.dispose()).not.toThrow();
    });
  });
});
