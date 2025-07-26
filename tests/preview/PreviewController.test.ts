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
import { createMockSuccessfulBuildResult } from "../__mocks__/mockBuildResult";

// Mock dependencies
jest.mock("../../src/build/BuildEngine");

describe("PreviewController", () => {
  let controller: PreviewController;
  let mockWebviewPanel: MockWebviewPanel;
  let mockBuildEngine: MockBuildEngine;

  // Jest spies for webview methods
  let postMessageSpy: jest.SpyInstance;
  let onDidReceiveMessageSpy: jest.SpyInstance;

  beforeEach(() => {
    // Setup: Reset BuildEngine mock
    BuildEngine.clearInstance();
    mockBuildEngine = new MockBuildEngine();
    (BuildEngine.getInstance as jest.Mock).mockReturnValue(mockBuildEngine);

    // Setup: Create mock webview panel with jest spies
    mockWebviewPanel = new MockWebviewPanel();
    postMessageSpy = jest.spyOn(mockWebviewPanel.webview, "postMessage");
    onDidReceiveMessageSpy = jest.spyOn(
      mockWebviewPanel.webview,
      "onDidReceiveMessage"
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockBuildEngine.reset();
    controller?.dispose();
  });

  describe(".constructor()", () => {
    test("should initialize with webview panel", () => {
      // Setup
      const webviewPanel = mockWebviewPanel as any;

      // Execute
      controller = new PreviewController(webviewPanel);

      // Assert
      expect(controller).toBeInstanceOf(PreviewController);
    });

    test("should setup webview HTML", () => {
      // Setup
      const webviewPanel = mockWebviewPanel as any;

      // Execute
      controller = new PreviewController(webviewPanel);

      // Assert
      expect(mockWebviewPanel.webview.html).toBeTruthy();
      expect(mockWebviewPanel.webview.html).toContain("<!DOCTYPE html>");
    });

    test("should register message handlers", () => {
      // Setup
      const webviewPanel = mockWebviewPanel as any;

      // Execute
      controller = new PreviewController(webviewPanel);

      // Assert
      expect(onDidReceiveMessageSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe(".preview()", () => {
    let mockDocument: vscode.TextDocument;

    beforeEach(() => {
      // Setup: Create controller and successful compilation for preview tests
      controller = new PreviewController(mockWebviewPanel as any);
      mockDocument = mockVSCodeDocument("/test/story.ink", "Test content");

      // Setup successful compilation
      const successfulResult =
        createMockSuccessfulBuildResult("/test/story.ink");
      mockBuildEngine.setCompilationResult(mockDocument.uri, successfulResult);
    });

    describe("when first time", () => {
      test("should set document and title", async () => {
        // Setup
        // Controller is fresh, not initialized

        // Execute
        const previewPromise = controller.preview(mockDocument);
        mockWebviewPanel.webview.simulateMessage({
          command: "ready",
          payload: {},
        });
        await previewPromise;

        // Assert
        expect(mockWebviewPanel.title).toBe("story.ink (Preview)");
      });

      test("should wait for webview ready before starting story", async () => {
        // Setup
        let storyStarted = false;
        const storyStartedSpy = jest.spyOn(mockBuildEngine, "compileStory");
        storyStartedSpy.mockImplementation(() => {
          storyStarted = true;
          return Promise.resolve(
            createMockSuccessfulBuildResult("/test/story.ink")
          );
        });

        // Execute
        const previewPromise = controller.preview(mockDocument);

        // Assert - story should not start before ready message
        expect(storyStarted).toBe(false);

        // Simulate ready message
        mockWebviewPanel.webview.simulateMessage({
          command: "ready",
          payload: {},
        });
        await previewPromise;

        // Assert - story should start after ready message
        expect(storyStarted).toBe(true);
      });

      test("should send state to webview after story starts", async () => {
        // Setup
        // Controller is fresh

        // Execute
        const previewPromise = controller.preview(mockDocument);
        mockWebviewPanel.webview.simulateMessage({
          command: "ready",
          payload: {},
        });
        await previewPromise;

        // Assert
        const sentMessages = mockWebviewPanel.webview.getSentMessages();
        expect(sentMessages).toContainEqual(
          expect.objectContaining({
            command: "updateState",
            payload: expect.objectContaining({
              state: expect.any(Object),
            }),
          })
        );
      });
    });

    describe("when already initialized", () => {
      test("should skip initialization and start story directly", async () => {
        // Setup - Initialize first
        const firstPreview = controller.preview(mockDocument);
        mockWebviewPanel.webview.simulateMessage({
          command: "ready",
          payload: {},
        });
        await firstPreview;

        // Clear previous compile calls
        mockBuildEngine.clearCallLog();

        // Execute - Second preview
        await controller.preview(mockDocument);

        // Assert - Story should be compiled again (for new preview)
        expect(mockBuildEngine.wasUriCompiled(mockDocument.uri)).toBe(true);
      });
    });
  });

  describe(".dispose()", () => {
    beforeEach(() => {
      // Setup: Create controller for dispose tests
      controller = new PreviewController(mockWebviewPanel as any);
    });

    test("should clean up webview message handlers", () => {
      // Setup
      const initialHandlerCount = mockWebviewPanel.webview.getHandlerCount();

      // Execute
      controller.dispose();

      // Assert
      expect(mockWebviewPanel.webview.getHandlerCount()).toBe(0);
    });
  });

  describe(".executeAction()", () => {
    // TODO: preview-state: implement executeAction tests
  });

  describe(".setTitle()", () => {
    beforeEach(() => {
      // Setup: Create controller for title tests
      controller = new PreviewController(mockWebviewPanel as any);
    });

    test("should extract filename from full path", () => {
      // Setup
      const mockDoc = mockVSCodeDocument("/path/to/story.ink", "content");

      // Execute
      controller.preview(mockDoc);

      // Assert
      expect(mockWebviewPanel.title).toBe("story.ink (Preview)");
    });

    test("should handle filename without extension", () => {
      // Setup
      const mockDoc = mockVSCodeDocument("/path/to/story", "content");

      // Execute
      controller.preview(mockDoc);

      // Assert
      expect(mockWebviewPanel.title).toBe("story (Preview)");
    });

    test("should handle just filename", () => {
      // Setup
      const mockDoc = mockVSCodeDocument("story.ink", "content");

      // Execute
      controller.preview(mockDoc);

      // Assert
      expect(mockWebviewPanel.title).toBe("story.ink (Preview)");
    });
  });
});
