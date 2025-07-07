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
import { VSCodeExtensionServiceImpl } from "../../src/services/VSCodeExtensionService";
import { MockVSCodeExtensionService } from "../__mocks__/MockVSCodeExtensionService";
import { VSCodeServiceLocator } from "../../src/services/VSCodeServiceLocator";

describe("VSCodeExtensionService", () => {
  let service: VSCodeExtensionServiceImpl;
  let mockService: MockVSCodeExtensionService;
  let mockWebview: any;

  beforeEach(() => {
    service = new VSCodeExtensionServiceImpl();
    mockService = new MockVSCodeExtensionService();

    // Setup mock webview
    mockWebview = {
      asWebviewUri: jest.fn((uri) => uri),
    };

    // Clear service locator state
    VSCodeServiceLocator.setExtensionService(service);
  });

  afterEach(() => {
    service.dispose();
    mockService.dispose();
  });

  describe("Service Locator Integration", () => {
    it("should be accessible through service locator", () => {
      // Execute
      const serviceFromLocator = VSCodeServiceLocator.getExtensionService();

      // Assert
      expect(serviceFromLocator).toBeInstanceOf(VSCodeExtensionServiceImpl);
    });

    it("should support mock injection", () => {
      // Setup
      VSCodeServiceLocator.setExtensionService(mockService);

      // Execute
      const serviceFromLocator = VSCodeServiceLocator.getExtensionService();

      // Assert
      expect(serviceFromLocator).toBe(mockService);
    });

    it("should return singleton instance", () => {
      // Execute
      const service1 = VSCodeServiceLocator.getExtensionService();
      const service2 = VSCodeServiceLocator.getExtensionService();

      // Assert
      expect(service1).toBe(service2);
    });
  });

  describe("getExtensionUri()", () => {
    it("should return the extension URI", () => {
      // Execute
      const result = service.getExtensionUri();

      // Assert
      expect(result).toBeDefined();
      expect(result.scheme).toBe("file");
    });

    it("should throw error if extension not found", () => {
      // Setup - Mock extensions.getExtension to return undefined
      const originalGetExtension = vscode.extensions.getExtension;
      vscode.extensions.getExtension = jest.fn().mockReturnValue(undefined);

      // Execute & Assert
      expect(() => service.getExtensionUri()).toThrow(
        "Extension bemisguided.vscode-ink-language-tools not found"
      );

      // Cleanup
      vscode.extensions.getExtension = originalGetExtension;
    });
  });

  describe("getExtensionPath()", () => {
    it("should return the extension path", () => {
      // Execute
      const result = service.getExtensionPath();

      // Assert
      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
    });
  });

  describe("getWebviewUri()", () => {
    it("should return webview URI for resource path", () => {
      // Setup
      const resourcePath = "test/resource.js";

      // Execute
      const result = service.getWebviewUri(mockWebview, resourcePath);

      // Assert
      expect(result).toBeDefined();
      expect(mockWebview.asWebviewUri).toHaveBeenCalled();
    });
  });

  describe("getWebviewMediaUri()", () => {
    it("should return webview URI for media file", () => {
      // Setup
      const fileName = "test.css";

      // Execute
      const result = service.getWebviewMediaUri(mockWebview, fileName);

      // Assert
      expect(result).toBeDefined();
      expect(mockWebview.asWebviewUri).toHaveBeenCalled();
    });
  });

  describe("getWebviewLocalResourceRoots()", () => {
    it("should return local resource roots", () => {
      // Execute
      const result = service.getWebviewLocalResourceRoots();

      // Assert
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe("getIconUri()", () => {
    it("should return icon URI for file name", () => {
      // Setup
      const fileName = "test.png";

      // Execute
      const result = service.getIconUri(fileName);

      // Assert
      expect(result).toBeDefined();
      expect(result.scheme).toBe("file");
      expect(result.fsPath).toContain("icons");
      expect(result.fsPath).toContain(fileName);
    });
  });

  describe("dispose()", () => {
    it("should dispose without errors", () => {
      // Execute & Assert - should not throw
      expect(() => service.dispose()).not.toThrow();
    });
  });
});

describe("MockVSCodeExtensionService", () => {
  let mockService: MockVSCodeExtensionService;
  let mockWebview: any;

  beforeEach(() => {
    mockService = new MockVSCodeExtensionService();
    mockWebview = {
      asWebviewUri: jest.fn((uri) => uri),
    };
  });

  afterEach(() => {
    mockService.dispose();
  });

  describe("Construction and Configuration", () => {
    test("should create with default configuration", () => {
      // Execute
      const service = new MockVSCodeExtensionService();

      // Assert
      expect(service.getExtensionPath()).toBe("/mock/extension/path");
    });

    test("should create with custom configuration", () => {
      // Setup
      const config = {
        extensionPath: "/custom/path",
        mediaDirectory: "assets",
        iconsDirectory: "images",
        webviewUriScheme: "custom-scheme",
      };

      // Execute
      const service = new MockVSCodeExtensionService(config);

      // Assert
      expect(service.getExtensionPath()).toBe("/custom/path");
    });

    test("should update configuration after creation", () => {
      // Setup
      const service = new MockVSCodeExtensionService();

      // Execute
      service.updateConfig({ extensionPath: "/updated/path" });

      // Assert
      expect(service.getExtensionPath()).toBe("/updated/path");
    });
  });

  describe("Enhanced Call Logging", () => {
    test("should track method calls with timestamps and results", () => {
      // Setup
      const fileName = "test.png";

      // Execute
      mockService.getExtensionUri();
      mockService.getIconUri(fileName);

      // Assert
      const callLog = mockService.getCallLog();
      expect(callLog).toHaveLength(2);

      expect(callLog[0]).toMatchObject({
        method: "getExtensionUri",
        args: [],
      });
      expect(callLog[0].timestamp).toBeGreaterThan(0);
      expect(callLog[0].result).toBeDefined();

      expect(callLog[1]).toMatchObject({
        method: "getIconUri",
        args: [fileName],
      });
    });

    test("should get calls for specific method", () => {
      // Setup
      mockService.getExtensionUri();
      mockService.getIconUri("icon1.png");
      mockService.getIconUri("icon2.png");

      // Execute
      const iconCalls = mockService.getCallsForMethod("getIconUri");

      // Assert
      expect(iconCalls).toHaveLength(2);
      expect(iconCalls[0].args).toEqual(["icon1.png"]);
      expect(iconCalls[1].args).toEqual(["icon2.png"]);
    });

    test("should get last call made", () => {
      // Setup
      mockService.getExtensionUri();
      mockService.getIconUri("test.png");

      // Execute
      const lastCall = mockService.getLastCall();

      // Assert
      expect(lastCall).toMatchObject({
        method: "getIconUri",
        args: ["test.png"],
      });
    });

    test("should get last call for specific method", () => {
      // Setup
      mockService.getExtensionUri();
      mockService.getIconUri("icon1.png");
      mockService.getExtensionPath();
      mockService.getIconUri("icon2.png");

      // Execute
      const lastIconCall = mockService.getLastCallForMethod("getIconUri");

      // Assert
      expect(lastIconCall).toMatchObject({
        method: "getIconUri",
        args: ["icon2.png"],
      });
    });

    test("should check if method was called", () => {
      // Setup
      mockService.getExtensionUri();

      // Execute & Assert
      expect(mockService.wasMethodCalled("getExtensionUri")).toBe(true);
      expect(mockService.wasMethodCalled("getIconUri")).toBe(false);
    });

    test("should check if method was called with specific arguments", () => {
      // Setup
      mockService.getIconUri("test.png");
      mockService.getWebviewMediaUri(mockWebview, "style.css");

      // Execute & Assert
      expect(mockService.wasMethodCalledWith("getIconUri", "test.png")).toBe(
        true
      );
      expect(mockService.wasMethodCalledWith("getIconUri", "other.png")).toBe(
        false
      );
      expect(
        mockService.wasMethodCalledWith(
          "getWebviewMediaUri",
          mockWebview,
          "style.css"
        )
      ).toBe(true);
    });

    test("should count method calls", () => {
      // Setup
      mockService.getExtensionUri();
      mockService.getIconUri("icon1.png");
      mockService.getIconUri("icon2.png");

      // Execute & Assert
      expect(mockService.getMethodCallCount("getExtensionUri")).toBe(1);
      expect(mockService.getMethodCallCount("getIconUri")).toBe(2);
      expect(mockService.getMethodCallCount("getExtensionPath")).toBe(0);
    });

    test("should clear call log", () => {
      // Setup
      mockService.getExtensionUri();
      expect(mockService.getCallLog()).toHaveLength(1);

      // Execute
      mockService.clearCallLog();

      // Assert
      expect(mockService.getCallLog()).toHaveLength(0);
    });

    test("should reset mock state", () => {
      // Setup
      mockService.getExtensionUri();
      mockService.updateConfig({ extensionPath: "/new/path" });

      // Execute
      mockService.reset();

      // Assert
      expect(mockService.getCallLog()).toHaveLength(0);
    });
  });

  describe("Enhanced Method Behavior", () => {
    test("should return realistic webview URIs", () => {
      // Setup
      const service = new MockVSCodeExtensionService({
        webviewUriScheme: "vscode-webview",
      });
      const resourcePath = "styles/main.css";

      // Execute
      const result = service.getWebviewUri(mockWebview, resourcePath);

      // Assert
      expect(result.toString()).toContain("vscode-webview");
      expect(result.toString()).toContain("extension-id");
      expect(result.toString()).toContain("styles/main.css");
    });

    test("should handle resource paths with leading slashes", () => {
      // Setup
      const resourcePath = "/scripts/app.js";

      // Execute
      const result = mockService.getWebviewUri(mockWebview, resourcePath);

      // Assert
      expect(result.toString()).toContain("vscode-webview");
      expect(result.toString()).toContain("extension-id");
      expect(result.toString()).toContain("scripts/app.js");
    });

    test("should return configured media URIs", () => {
      // Setup
      const service = new MockVSCodeExtensionService({
        mediaDirectory: "assets",
        webviewUriScheme: "custom-scheme",
      });
      const fileName = "image.png";

      // Execute
      const result = service.getWebviewMediaUri(mockWebview, fileName);

      // Assert
      expect(result.toString()).toContain("custom-scheme");
      expect(result.toString()).toContain("extension-id");
      expect(result.toString()).toContain("assets");
      expect(result.toString()).toContain("image.png");
    });

    test("should return multiple local resource roots", () => {
      // Setup
      const service = new MockVSCodeExtensionService({
        extensionPath: "/test/extension",
        mediaDirectory: "media",
        iconsDirectory: "icons",
      });

      // Execute
      const result = service.getWebviewLocalResourceRoots();

      // Assert
      expect(result).toHaveLength(2);
      expect(result[0].fsPath).toBe("/test/extension/media");
      expect(result[1].fsPath).toBe("/test/extension/icons");
    });

    test("should return configured icon URIs", () => {
      // Setup
      const service = new MockVSCodeExtensionService({
        extensionPath: "/custom/extension",
        iconsDirectory: "images",
      });
      const fileName = "app.ico";

      // Execute
      const result = service.getIconUri(fileName);

      // Assert
      expect(result.fsPath).toBe("/custom/extension/images/app.ico");
    });
  });

  describe("Static Factory Methods", () => {
    test("should create default mock", () => {
      // Execute
      const service = MockVSCodeExtensionService.createDefault();

      // Assert
      expect(service.getExtensionPath()).toBe("/mock/extension/path");
    });

    test("should create webview testing mock", () => {
      // Execute
      const service = MockVSCodeExtensionService.createForWebviewTesting();
      const result = service.getWebviewMediaUri(mockWebview, "test.css");

      // Assert
      expect(result.toString()).toContain("vscode-webview");
      expect(result.toString()).toContain("extension-id");
      expect(result.toString()).toContain("media");
      expect(result.toString()).toContain("test.css");
    });

    test("should create error testing mock", () => {
      // Execute
      const service = MockVSCodeExtensionService.createForErrorTesting();

      // Assert
      expect(() => service.getExtensionUri()).toThrow(
        "Mock error in getExtensionUri"
      );
    });

    test("should create error testing mock with custom messages", () => {
      // Setup
      const errorMessages = {
        getExtensionUri: "Custom extension error",
        getIconUri: "Custom icon error",
      };

      // Execute
      const service =
        MockVSCodeExtensionService.createForErrorTesting(errorMessages);

      // Assert
      expect(() => service.getExtensionUri()).toThrow("Custom extension error");
      expect(() => service.getIconUri("test.png")).toThrow("Custom icon error");
    });

    test("should create mock with custom extension path", () => {
      // Execute
      const service =
        MockVSCodeExtensionService.createWithExtensionPath("/special/path");

      // Assert
      expect(service.getExtensionPath()).toBe("/special/path");
    });
  });

  describe("Error Simulation", () => {
    test("should throw configured errors", () => {
      // Setup
      const service = new MockVSCodeExtensionService({
        shouldThrowErrors: true,
        errorMessages: {
          getExtensionPath: "Simulated path error",
        },
      });

      // Execute & Assert
      expect(() => service.getExtensionPath()).toThrow("Simulated path error");
      expect(() => service.getExtensionUri()).toThrow(
        "Mock error in getExtensionUri"
      );
    });

    test("should log errors in call history", () => {
      // Setup
      const service = MockVSCodeExtensionService.createForErrorTesting({
        getIconUri: "Icon error",
      });

      // Execute
      try {
        service.getIconUri("test.png");
      } catch (error) {
        // Expected error
      }

      // Assert
      const calls = service.getCallsForMethod("getIconUri");
      expect(calls).toHaveLength(1);
      expect(calls[0].result).toBeInstanceOf(Error);
    });
  });

  describe("Backwards Compatibility", () => {
    test("should maintain basic call logging functionality", () => {
      // Setup
      const fileName = "test.png";

      // Execute
      mockService.getExtensionUri();
      mockService.getExtensionPath();
      mockService.getIconUri(fileName);

      // Assert - this mirrors the old test format
      const callLog = mockService.getCallLog();
      expect(callLog).toHaveLength(3);
      expect(callLog[0].method).toBe("getExtensionUri");
      expect(callLog[0].args).toEqual([]);
      expect(callLog[1].method).toBe("getExtensionPath");
      expect(callLog[1].args).toEqual([]);
      expect(callLog[2].method).toBe("getIconUri");
      expect(callLog[2].args).toEqual([fileName]);
    });

    test("should handle disposal gracefully", () => {
      // Execute & Assert - should not throw
      expect(() => mockService.dispose()).not.toThrow();
    });
  });
});
