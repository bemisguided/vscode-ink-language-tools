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

import * as vscode from "vscode";
import { PreviewController } from "../../src/preview/PreviewController";
import { BuildEngine } from "../../src/build/BuildEngine";
import { MockBuildEngine } from "../__mocks__/MockBuildEngine";
import { MockWebviewPanel } from "../__mocks__/MockWebviewPanel";
import { mockVSCodeDocument } from "../__mocks__/mockVSCodeDocument";
import {
  createMockSuccessfulBuildResult,
  createMockFailedBuildResult,
} from "../__mocks__/mockBuildResult";
import { inboundMessages } from "../../src/preview/PreviewMessages";

// Mock the BuildEngine
jest.mock("../../src/build/BuildEngine");

describe("PreviewController", () => {
  let controller: PreviewController;
  let mockWebviewPanel: MockWebviewPanel;
  let mockBuildEngine: MockBuildEngine;
  let mockDocument: vscode.TextDocument;

  beforeEach(() => {
    // Reset BuildEngine mock
    BuildEngine.clearInstance();
    mockBuildEngine = new MockBuildEngine();
    (BuildEngine.getInstance as jest.Mock).mockReturnValue(mockBuildEngine);

    // Create mock webview panel and controller
    mockWebviewPanel = new MockWebviewPanel();
    controller = new PreviewController(mockWebviewPanel as any);

    // Create mock document
    mockDocument = mockVSCodeDocument(
      "/test/story.ink",
      "Welcome to the test story!"
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockBuildEngine.reset();
    controller.dispose();
  });

  describe("Initialization", () => {
    test("should setup webview on creation", () => {
      // The webview should be set up with HTML content
      expect(mockWebviewPanel.webview.html).toBeTruthy();
      expect(mockWebviewPanel.webview.html).toContain("<!DOCTYPE html>");
      expect(mockWebviewPanel.webview.html).toContain("Ink Story Preview");
    });

    test("should set webview title with document name", async () => {
      // Execute
      const previewPromise = controller.preview(mockDocument);
      mockWebviewPanel.webview.simulateMessage({
        command: inboundMessages.ready,
        payload: {},
      });
      await previewPromise;

      // Assert
      expect(mockWebviewPanel.title).toBe("story.ink (Preview)");
    });

    test("should handle webview ready message", async () => {
      // Execute
      const previewPromise = controller.preview(mockDocument);
      mockWebviewPanel.webview.simulateMessage({
        command: inboundMessages.ready,
        payload: {},
      });
      await previewPromise;

      // Assert - story should start after ready message
      const messages = mockWebviewPanel.webview.getSentMessages();
      expect(messages).toContainEqual(
        expect.objectContaining({
          command: "updateState",
          payload: expect.objectContaining({
            isStart: true,
            lastChoiceIndex: 2, // Set to number of story events (welcome + question)
            storyEvents: expect.any(Array),
            currentChoices: expect.any(Array),
          }),
        })
      );
    });

    test("should not restart initialization on subsequent previews", async () => {
      // Execute - first preview
      const previewPromise1 = controller.preview(mockDocument);
      mockWebviewPanel.webview.simulateMessage({
        command: inboundMessages.ready,
        payload: {},
      });
      await previewPromise1;

      mockWebviewPanel.webview.clearSentMessages();

      // Execute - second preview
      await controller.preview(mockDocument);

      // Assert - ready message should not be waited for again
      const messages = mockWebviewPanel.webview.getSentMessages();
      expect(messages).toContainEqual(
        expect.objectContaining({
          command: "updateState",
          payload: expect.objectContaining({
            isStart: true,
            lastChoiceIndex: 2, // Set to number of story events (welcome + question)
            storyEvents: expect.any(Array),
            currentChoices: expect.any(Array),
          }),
        })
      );
    });
  });

  describe("Story Compilation and Startup", () => {
    test("should compile and start story successfully", async () => {
      // Arrange
      const successfulResult =
        createMockSuccessfulBuildResult("/test/story.ink");
      mockBuildEngine.setCompilationResult(mockDocument.uri, successfulResult);

      // Act
      const previewPromise = controller.preview(mockDocument);
      mockWebviewPanel.webview.simulateMessage({
        command: inboundMessages.ready,
        payload: {},
      });
      await previewPromise;

      // Assert
      expect(mockBuildEngine.wasUriCompiled(mockDocument.uri)).toBe(true);
      const messages = mockWebviewPanel.webview.getSentMessages();
      expect(messages).toContainEqual(
        expect.objectContaining({
          command: "updateState",
          payload: expect.objectContaining({
            isStart: true,
            lastChoiceIndex: 2, // Set to number of story events (welcome + question)
            storyEvents: expect.any(Array),
            currentChoices: expect.any(Array),
            isEnded: false,
            errors: expect.any(Array),
          }),
        })
      );
    });

    test("should handle compilation failure", async () => {
      // Arrange
      const failedResult = createMockFailedBuildResult(
        "/test/story.ink",
        "Syntax error"
      );
      mockBuildEngine.setCompilationResult(mockDocument.uri, failedResult);

      // Act
      const previewPromise = controller.preview(mockDocument);
      mockWebviewPanel.webview.simulateMessage({
        command: inboundMessages.ready,
        payload: {},
      });
      await previewPromise;

      // Assert
      const messages = mockWebviewPanel.webview.getSentMessages();
      expect(messages).toContainEqual(
        expect.objectContaining({
          command: "updateState",
          payload: expect.objectContaining({
            errors: expect.arrayContaining([
              expect.objectContaining({
                message: expect.stringContaining("could not be compiled"),
                severity: "error",
              }),
            ]),
            storyEvents: [],
            currentChoices: [],
            isEnded: false,
            isStart: false,
            lastChoiceIndex: 0,
          }),
        })
      );
    });

    test("should handle compilation errors during build", async () => {
      // Setup
      mockBuildEngine.setShouldFailCompilation(true, "Build engine error");

      // Execute
      const previewPromise = controller.preview(mockDocument);
      mockWebviewPanel.webview.simulateMessage({
        command: inboundMessages.ready,
        payload: {},
      });
      await previewPromise;

      // Assert
      const messages = mockWebviewPanel.webview.getSentMessages();
      expect(messages).toContainEqual(
        expect.objectContaining({
          command: "updateState",
          payload: expect.objectContaining({
            errors: expect.arrayContaining([
              expect.objectContaining({
                message: expect.stringContaining("could not be compiled"),
                severity: "error",
              }),
            ]),
            storyEvents: [],
            currentChoices: [],
            isEnded: false,
            isStart: false,
            lastChoiceIndex: 0,
          }),
        })
      );
    });
  });

  describe("User Interactions", () => {
    beforeEach(async () => {
      // Setup a successful story for interaction tests
      const successfulResult =
        createMockSuccessfulBuildResult("/test/story.ink");
      mockBuildEngine.setCompilationResult(mockDocument.uri, successfulResult);

      const previewPromise = controller.preview(mockDocument);
      mockWebviewPanel.webview.simulateMessage({
        command: inboundMessages.ready,
        payload: {},
      });
      await previewPromise;

      mockWebviewPanel.webview.clearSentMessages();
    });

    test("should handle choice selection", () => {
      // Execute
      mockWebviewPanel.webview.simulateMessage({
        command: inboundMessages.action,
        payload: { type: "SELECT_CHOICE", payload: { choiceIndex: 1 } },
      });

      // Assert
      const messages = mockWebviewPanel.webview.getSentMessages();
      expect(messages).toContainEqual(
        expect.objectContaining({
          command: "updateState",
          payload: expect.objectContaining({
            storyEvents: expect.any(Array),
            currentChoices: expect.any(Array),
          }),
        })
      );
    });

    test("should handle story restart", async () => {
      // Execute
      mockWebviewPanel.webview.simulateMessage({
        command: inboundMessages.action,
        payload: { type: "RESTART_STORY" },
      });

      // Wait for any async operations
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Assert
      const messages = mockWebviewPanel.webview.getSentMessages();
      expect(messages).toContainEqual(
        expect.objectContaining({
          command: "updateState",
          payload: expect.objectContaining({
            isStart: true,
            lastChoiceIndex: 2, // Set to number of story events (welcome + question)
            storyEvents: expect.any(Array),
            currentChoices: expect.any(Array),
          }),
        })
      );
    });
  });

  describe("Story End Handling", () => {
    test("should send end story message when story ends", async () => {
      // Setup - use minimal story that ends immediately
      const endingResult = createMockSuccessfulBuildResult(
        "/test/ending.ink",
        true
      );
      mockBuildEngine.setCompilationResult(mockDocument.uri, endingResult);

      // Execute
      const previewPromise = controller.preview(mockDocument);
      mockWebviewPanel.webview.simulateMessage({
        command: inboundMessages.ready,
        payload: {},
      });
      await previewPromise;

      // Assert
      const messages = mockWebviewPanel.webview.getSentMessages();
      expect(messages).toContainEqual(
        expect.objectContaining({
          command: "updateState",
          payload: expect.objectContaining({
            isEnded: true,
            isStart: false,
            lastChoiceIndex: 1, // Set to number of story events (just "Hello world!")
          }),
        })
      );
    });
  });

  // TODO: Error propagation tests have been removed during refactoring
  // Error handling is now managed at the controller level via story.onError
  // and at the action level for execution errors. Consider adding integration
  // tests that verify error handling through the action system.

  describe("Document Management", () => {
    test("should handle different documents", async () => {
      // Setup
      const document1 = mockVSCodeDocument(
        "/test/story1.ink",
        "Story 1 content"
      );
      const document2 = mockVSCodeDocument(
        "/test/story2.ink",
        "Story 2 content"
      );

      mockBuildEngine.setCompilationResult(
        document1.uri,
        createMockSuccessfulBuildResult("/test/story1.ink")
      );
      mockBuildEngine.setCompilationResult(
        document2.uri,
        createMockSuccessfulBuildResult("/test/story2.ink")
      );

      // Execute - preview first document
      const preview1Promise = controller.preview(document1);
      mockWebviewPanel.webview.simulateMessage({
        command: inboundMessages.ready,
        payload: {},
      });
      await preview1Promise;

      expect(mockWebviewPanel.title).toBe("story1.ink (Preview)");

      mockWebviewPanel.webview.clearSentMessages();

      // Execute - preview second document
      await controller.preview(document2);

      // Assert
      expect(mockBuildEngine.wasUriCompiled(document1.uri)).toBe(true);
      expect(mockBuildEngine.wasUriCompiled(document2.uri)).toBe(true);
      expect(mockWebviewPanel.title).toBe("story2.ink (Preview)");
      const messages = mockWebviewPanel.webview.getSentMessages();
      expect(messages).toContainEqual(
        expect.objectContaining({
          command: "updateState",
          payload: expect.objectContaining({
            isStart: true,
            lastChoiceIndex: 2, // Set to number of story events (welcome + question)
          }),
        })
      );
    });
  });

  describe("Resource Management", () => {
    test("should dispose resources properly", () => {
      // Execute
      controller.dispose();

      // Assert - webview should have no handlers after disposal
      expect(mockWebviewPanel.webview.getHandlerCount()).toBe(0);
    });
  });
});
