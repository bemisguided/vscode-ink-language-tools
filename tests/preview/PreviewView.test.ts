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

import { PreviewView } from "../../src/preview/PreviewView";
import { MockWebviewPanel } from "../__mocks__/MockWebviewPanel";
import { MockVSCodeExtensionService } from "../__mocks__/MockVSCodeExtensionService";
import { StoryUpdate } from "../../src/preview/types";
import {
  inboundMessages,
  outboundMessages,
} from "../../src/preview/PreviewMessages";
import { VSCodeServiceLocator } from "../../src/services/VSCodeServiceLocator";

describe("PreviewView", () => {
  let view: PreviewView;
  let mockPanel: MockWebviewPanel;
  let mockExtensionService: MockVSCodeExtensionService;

  beforeEach(() => {
    // Setup the mock extension service for webview testing
    mockExtensionService = MockVSCodeExtensionService.createForWebviewTesting();
    VSCodeServiceLocator.setExtensionService(mockExtensionService);

    mockPanel = new MockWebviewPanel();
    view = new PreviewView(mockPanel as any);
  });

  afterEach(() => {
    view.dispose();
    mockPanel.dispose();
    mockExtensionService.reset();
  });

  describe("Initialization", () => {
    test("should initialize webview with HTML content", () => {
      // Execute
      view.initialize();

      // Assert
      expect(mockPanel.webview.html).toContain("<!DOCTYPE html>");
      expect(mockPanel.webview.html).toContain("Ink Story Preview");
      expect(mockPanel.webview.html).toContain("story-content");
      expect(mockPanel.webview.html).toContain("choices-container");
    });

    test("should setup message handlers", () => {
      // Execute
      view.initialize();

      // Assert
      expect(mockPanel.webview.getHandlerCount()).toBeGreaterThan(0);
    });

    test("should include error indicators in HTML", () => {
      // Execute
      view.initialize();

      // Assert
      expect(mockPanel.webview.html).toContain("error-indicators");
      expect(mockPanel.webview.html).toContain("button-errors-error");
      expect(mockPanel.webview.html).toContain("button-errors-warning");
      expect(mockPanel.webview.html).toContain("button-errors-info");
    });

    test("should include error modal in HTML", () => {
      // Execute
      view.initialize();

      // Assert
      expect(mockPanel.webview.html).toContain("error-modal");
      expect(mockPanel.webview.html).toContain("error-list");
      expect(mockPanel.webview.html).toContain("close-error-modal");
    });

    test("should include restart button in HTML", () => {
      // Execute
      view.initialize();

      // Assert
      expect(mockPanel.webview.html).toContain("button-restart");
      expect(mockPanel.webview.html).toContain("Restart");
    });
  });

  describe("Title Management", () => {
    test("should set title with basename of file", () => {
      // Execute
      view.setTitle("/path/to/story.ink");

      // Assert
      expect(mockPanel.title).toBe("story.ink (Preview)");
    });

    test("should handle complex file paths", () => {
      // Execute
      view.setTitle("/very/long/path/to/my-story-file.ink");

      // Assert
      expect(mockPanel.title).toBe("my-story-file.ink (Preview)");
    });
  });

  describe("Message Sending", () => {
    beforeEach(() => {
      view.initialize();
      mockPanel.webview.clearSentMessages();
    });

    test("should send start story message", () => {
      // Execute
      view.startStory();

      // Assert
      const messages = mockPanel.webview.getSentMessages();
      expect(messages).toContainEqual({
        command: outboundMessages.startStory,
        payload: {},
      });
    });

    test("should send story update message", () => {
      // Setup
      const update: StoryUpdate = {
        events: [
          {
            type: "text",
            text: "Hello world",
            tags: ["greeting"],
          },
        ],
        choices: [
          {
            index: 0,
            text: "Say hello back",
            tags: [],
          },
        ],
        hasEnded: false,
      };

      // Execute
      view.updateStory(update);

      // Assert
      const messages = mockPanel.webview.getSentMessages();
      expect(messages).toContainEqual({
        command: outboundMessages.updateStory,
        payload: update,
      });
    });

    test("should send end story message", () => {
      // Execute
      view.endStory();

      // Assert
      const messages = mockPanel.webview.getSentMessages();
      expect(messages).toContainEqual({
        command: outboundMessages.endStory,
        payload: {},
      });
    });

    test("should send error message with severity", () => {
      // Execute
      view.showError("Test error message", "warning");

      // Assert
      const messages = mockPanel.webview.getSentMessages();
      expect(messages).toContainEqual({
        command: outboundMessages.showError,
        payload: {
          message: "Test error message",
          severity: "warning",
        },
      });
    });

    test("should default error severity to 'error'", () => {
      // Execute
      view.showError("Test error message");

      // Assert
      const messages = mockPanel.webview.getSentMessages();
      expect(messages).toContainEqual({
        command: outboundMessages.showError,
        payload: {
          message: "Test error message",
          severity: "error",
        },
      });
    });
  });

  describe("Message Receiving", () => {
    beforeEach(() => {
      view.initialize();
    });

    test("should handle ready message", () => {
      // Setup
      const readyCallback = jest.fn();
      view.onReady(readyCallback);

      // Execute
      mockPanel.webview.simulateMessage({
        command: inboundMessages.ready,
        payload: {},
      });

      // Assert
      expect(readyCallback).toHaveBeenCalled();
    });

    test("should handle choice selection message", () => {
      // Setup
      const choiceCallback = jest.fn();
      view.onChoiceSelected(choiceCallback);

      // Execute
      mockPanel.webview.simulateMessage({
        command: inboundMessages.selectChoice,
        payload: { choiceIndex: 2 },
      });

      // Assert
      expect(choiceCallback).toHaveBeenCalledWith(2);
    });

    test("should handle restart message", () => {
      // Setup
      const restartCallback = jest.fn();
      view.onRestart(restartCallback);

      // Execute
      mockPanel.webview.simulateMessage({
        command: inboundMessages.restartStory,
        payload: {},
      });

      // Assert
      expect(restartCallback).toHaveBeenCalled();
    });

    test("should handle log message", () => {
      // Setup
      const consoleSpy = jest.spyOn(console, "debug").mockImplementation();

      // Execute
      mockPanel.webview.simulateMessage({
        command: inboundMessages.log,
        payload: { message: "Test log message" },
      });

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining("Test log message")
      );

      consoleSpy.mockRestore();
    });

    test("should ignore unknown messages", () => {
      // Setup
      const readyCallback = jest.fn();
      view.onReady(readyCallback);

      // Execute
      mockPanel.webview.simulateMessage({
        command: "unknownCommand",
        payload: {},
      });

      // Assert
      expect(readyCallback).not.toHaveBeenCalled();
    });

    test("should handle multiple callbacks for same message", () => {
      // Setup
      const callback1 = jest.fn();
      const callback2 = jest.fn();
      view.onReady(callback1);
      view.onReady(callback2);

      // Execute
      mockPanel.webview.simulateMessage({
        command: inboundMessages.ready,
        payload: {},
      });

      // Assert
      expect(callback1).toHaveBeenCalled();
      expect(callback2).toHaveBeenCalled();
    });
  });

  describe("Resource Management", () => {
    test("should dispose of resources properly", () => {
      // Setup
      view.initialize();
      const callback = jest.fn();
      view.onReady(callback);

      // Execute
      view.dispose();

      // Assert
      expect(mockPanel.isDisposedState()).toBe(true);
    });

    test("should handle disposal before initialization", () => {
      // Execute & Assert - should not throw
      expect(() => view.dispose()).not.toThrow();
    });
  });

  describe("Error Scenarios", () => {
    test("should handle unknown message commands gracefully", () => {
      // Setup
      view.initialize();

      // Execute & Assert - should not crash when handling unknown commands
      expect(() => {
        mockPanel.webview.simulateMessage({
          command: "unknownTestCommand",
          payload: { test: "data" },
        });
      }).not.toThrow();
    });

    test("should handle messages with missing command gracefully", () => {
      // Setup
      view.initialize();

      // Execute & Assert - should not crash when message has no command
      expect(() => {
        mockPanel.webview.simulateMessage({
          payload: { test: "data" },
        } as any);
      }).not.toThrow();
    });
  });

  describe("Webview Content Generation", () => {
    test("should include CSS and JS resources", () => {
      // Execute
      view.initialize();

      // Assert
      expect(mockPanel.webview.html).toContain('rel="stylesheet"');
      expect(mockPanel.webview.html).toContain('href="');
      expect(mockPanel.webview.html).toContain('src="');
      expect(mockPanel.webview.html).toContain("preview.css");
      expect(mockPanel.webview.html).toContain("preview.js");
    });

    test("should include SVG icon references", () => {
      // Execute
      view.initialize();

      // Assert
      expect(mockPanel.webview.html).toContain("window.svgIcons");
      expect(mockPanel.webview.html).toContain("error:");
      expect(mockPanel.webview.html).toContain("warning:");
      expect(mockPanel.webview.html).toContain("info:");
      expect(mockPanel.webview.html).toContain("restart:");
    });

    test("should be valid HTML", () => {
      // Execute
      view.initialize();

      // Assert
      const html = mockPanel.webview.html;
      expect(html).toMatch(/^<!DOCTYPE html>/);
      expect(html).toContain("<html");
      expect(html).toContain("</html>");
      expect(html).toContain("<head>");
      expect(html).toContain("</head>");
      expect(html).toContain("<body>");
      expect(html).toContain("</body>");
    });

    test("should use extension service to generate webview URIs", () => {
      // Execute
      view.initialize();

      // Assert - verify the extension service was called for all required media files
      expect(
        mockExtensionService.wasMethodCalledWith(
          "getWebviewMediaUri",
          mockPanel.webview,
          "preview.css"
        )
      ).toBe(true);
      expect(
        mockExtensionService.wasMethodCalledWith(
          "getWebviewMediaUri",
          mockPanel.webview,
          "preview.js"
        )
      ).toBe(true);
      expect(
        mockExtensionService.wasMethodCalledWith(
          "getWebviewMediaUri",
          mockPanel.webview,
          "error-icon.svg"
        )
      ).toBe(true);
      expect(
        mockExtensionService.wasMethodCalledWith(
          "getWebviewMediaUri",
          mockPanel.webview,
          "warning-icon.svg"
        )
      ).toBe(true);
      expect(
        mockExtensionService.wasMethodCalledWith(
          "getWebviewMediaUri",
          mockPanel.webview,
          "info-icon.svg"
        )
      ).toBe(true);
      expect(
        mockExtensionService.wasMethodCalledWith(
          "getWebviewMediaUri",
          mockPanel.webview,
          "restart-icon.svg"
        )
      ).toBe(true);

      // Verify the correct number of calls were made
      expect(
        mockExtensionService.getMethodCallCount("getWebviewMediaUri")
      ).toBe(6);
    });
  });
});
