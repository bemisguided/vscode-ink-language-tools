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
import { mockVSCodeDocument } from "../__mocks__/mockVSCodeDocument";
import {
  createMockSuccessfulBuildResult,
  createMockFailedBuildResult,
} from "../__mocks__/mockBuildResult";

// Mock the BuildEngine
jest.mock("../../src/build/BuildEngine");

// Mock PreviewView
class MockPreviewView {
  public title: string = "";
  public onReadyCallback?: () => void;
  public onChoiceSelectedCallback?: (index: number) => void;
  public onRestartCallback?: () => void;

  private sentMessages: Array<{ method: string; args: any[] }> = [];

  public initialize(): void {
    this.logCall("initialize", []);
  }

  public setTitle(fileName: string): void {
    this.title = fileName;
    this.logCall("setTitle", [fileName]);
  }

  public startStory(): void {
    this.logCall("startStory", []);
  }

  public updateStory(update: any): void {
    this.logCall("updateStory", [update]);
  }

  public endStory(): void {
    this.logCall("endStory", []);
  }

  public showError(message: string, severity: string = "error"): void {
    this.logCall("showError", [message, severity]);
  }

  public onReady(callback: () => void): void {
    this.onReadyCallback = callback;
    this.logCall("onReady", []);
  }

  public onChoiceSelected(callback: (index: number) => void): void {
    this.onChoiceSelectedCallback = callback;
    this.logCall("onChoiceSelected", []);
  }

  public onRestart(callback: () => void): void {
    this.onRestartCallback = callback;
    this.logCall("onRestart", []);
  }

  // Test helper methods
  public simulateReady(): void {
    if (this.onReadyCallback) {
      this.onReadyCallback();
    }
  }

  public simulateChoiceSelected(index: number): void {
    if (this.onChoiceSelectedCallback) {
      this.onChoiceSelectedCallback(index);
    }
  }

  public simulateRestart(): void {
    if (this.onRestartCallback) {
      this.onRestartCallback();
    }
  }

  public getSentMessages(): Array<{ method: string; args: any[] }> {
    return [...this.sentMessages];
  }

  public getLastMessage(): { method: string; args: any[] } | undefined {
    return this.sentMessages[this.sentMessages.length - 1];
  }

  public clearMessages(): void {
    this.sentMessages = [];
  }

  private logCall(method: string, args: any[]): void {
    this.sentMessages.push({ method, args });
  }
}

describe("PreviewController", () => {
  let controller: PreviewController;
  let mockView: MockPreviewView;
  let mockBuildEngine: MockBuildEngine;
  let mockDocument: vscode.TextDocument;

  beforeEach(() => {
    // Reset BuildEngine mock
    BuildEngine.clearInstance();
    mockBuildEngine = new MockBuildEngine();
    (BuildEngine.getInstance as jest.Mock).mockReturnValue(mockBuildEngine);

    // Create mock view and controller
    mockView = new MockPreviewView();
    controller = new PreviewController(mockView as any);

    // Create mock document
    mockDocument = mockVSCodeDocument(
      "/test/story.ink",
      "Welcome to the test story!"
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockBuildEngine.reset();
  });

  describe("Initialization", () => {
    test("should setup event handlers on first preview", async () => {
      // Execute
      const previewPromise = controller.preview(mockDocument);
      mockView.simulateReady();
      await previewPromise;

      // Assert
      expect(mockView.getSentMessages()).toContainEqual(
        expect.objectContaining({ method: "onReady" })
      );
      expect(mockView.getSentMessages()).toContainEqual(
        expect.objectContaining({ method: "onChoiceSelected" })
      );
      expect(mockView.getSentMessages()).toContainEqual(
        expect.objectContaining({ method: "onRestart" })
      );
    });

    test("should set view title with document name", async () => {
      // Execute
      const previewPromise = controller.preview(mockDocument);
      mockView.simulateReady();
      await previewPromise;

      // Assert
      expect(mockView.title).toBe("/test/story.ink");
    });

    test("should initialize view only once", async () => {
      // Execute - first preview
      const previewPromise1 = controller.preview(mockDocument);
      mockView.simulateReady();
      await previewPromise1;

      mockView.clearMessages();

      // Execute - second preview
      await controller.preview(mockDocument);

      // Assert - initialize should not be called again
      const messages = mockView.getSentMessages();
      const initializeCalls = messages.filter(
        (msg) => msg.method === "initialize"
      );
      expect(initializeCalls).toHaveLength(0);
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
      mockView.simulateReady();
      await previewPromise;

      // Assert
      expect(mockBuildEngine.wasUriCompiled(mockDocument.uri)).toBe(true);
      expect(mockView.getSentMessages()).toContainEqual(
        expect.objectContaining({ method: "startStory" })
      );
      expect(mockView.getSentMessages()).toContainEqual(
        expect.objectContaining({ method: "updateStory" })
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
      mockView.simulateReady();
      await previewPromise;

      // Assert
      expect(mockView.getSentMessages()).toContainEqual(
        expect.objectContaining({
          method: "showError",
          args: expect.arrayContaining([
            expect.stringContaining("could not be compiled"),
            "error",
          ]),
        })
      );
    });

    test("should handle compilation errors during build", async () => {
      // Setup
      mockBuildEngine.setShouldFailCompilation(true, "Build engine error");

      // Execute
      const previewPromise = controller.preview(mockDocument);
      mockView.simulateReady();
      await previewPromise;

      // Assert
      expect(mockView.getSentMessages()).toContainEqual(
        expect.objectContaining({
          method: "showError",
          args: expect.arrayContaining([
            expect.stringContaining("could not be compiled"),
            "error",
          ]),
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
      mockView.simulateReady();
      await previewPromise;

      mockView.clearMessages();
    });

    test("should handle choice selection", () => {
      // Execute
      mockView.simulateChoiceSelected(1);

      // Assert
      expect(mockView.getSentMessages()).toContainEqual(
        expect.objectContaining({ method: "updateStory" })
      );
    });

    test("should handle story restart", async () => {
      // Execute
      mockView.simulateRestart();

      // Wait for any async operations
      await new Promise((resolve) => setTimeout(resolve, 0));

      // Assert
      expect(mockView.getSentMessages()).toContainEqual(
        expect.objectContaining({ method: "startStory" })
      );
      expect(mockView.getSentMessages()).toContainEqual(
        expect.objectContaining({ method: "updateStory" })
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
      mockView.simulateReady();
      await previewPromise;

      // Assert
      expect(mockView.getSentMessages()).toContainEqual(
        expect.objectContaining({ method: "endStory" })
      );
    });
  });

  describe("Error Propagation", () => {
    test("should propagate model errors to view", async () => {
      // Setup
      const successfulResult =
        createMockSuccessfulBuildResult("/test/story.ink");
      mockBuildEngine.setCompilationResult(mockDocument.uri, successfulResult);

      // Execute
      const previewPromise = controller.preview(mockDocument);
      mockView.simulateReady();
      await previewPromise;

      // Get the model and trigger an error
      const controller_: any = controller;
      const model = controller_.model;
      if (model && model.onError) {
        // Simulate an error from the model
        const errorCallback = (controller_ as any).model.errorCallback;
        if (errorCallback) {
          errorCallback("Test runtime error", "error");
        }
      }

      // Assert
      // The error should be propagated to the view
      const errorMessages = mockView
        .getSentMessages()
        .filter((msg) => msg.method === "showError");
      expect(errorMessages.length).toBeGreaterThan(0);
    });
  });

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
      mockView.simulateReady();
      await preview1Promise;

      mockView.clearMessages();

      // Execute - preview second document
      await controller.preview(document2);

      // Assert
      expect(mockBuildEngine.wasUriCompiled(document1.uri)).toBe(true);
      expect(mockBuildEngine.wasUriCompiled(document2.uri)).toBe(true);
      expect(mockView.getSentMessages()).toContainEqual(
        expect.objectContaining({ method: "startStory" })
      );
    });
  });
});
