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

  describe("Call Logging", () => {
    it("should track method calls with parameters", () => {
      // Setup
      const fileName = "test.png";

      // Execute
      mockService.getExtensionUri();
      mockService.getExtensionPath();
      mockService.getIconUri(fileName);

      // Assert
      const callLog = mockService.getCallLog();
      expect(callLog).toHaveLength(3);
      expect(callLog[0]).toEqual({ method: "getExtensionUri", args: [] });
      expect(callLog[1]).toEqual({ method: "getExtensionPath", args: [] });
      expect(callLog[2]).toEqual({ method: "getIconUri", args: [fileName] });
    });

    it("should clear call log when requested", () => {
      // Setup
      mockService.getExtensionUri();
      expect(mockService.getCallLog()).toHaveLength(1);

      // Execute
      mockService.clearCallLog();

      // Assert
      expect(mockService.getCallLog()).toHaveLength(0);
    });
  });

  describe("Method Behavior", () => {
    it("should return mock extension URI", () => {
      // Execute
      const result = mockService.getExtensionUri();

      // Assert
      expect(result.fsPath).toBe("/mock/extension/path");
    });

    it("should return mock extension path", () => {
      // Execute
      const result = mockService.getExtensionPath();

      // Assert
      expect(result).toBe("/mock/extension/path");
    });

    it("should return mock webview URI", () => {
      // Setup
      const resourcePath = "test/resource.js";

      // Execute
      const result = mockService.getWebviewUri(mockWebview, resourcePath);

      // Assert
      expect(result.fsPath).toBe(`/mock/webview/uri/${resourcePath}`);
    });

    it("should return mock webview media URI", () => {
      // Setup
      const fileName = "test.css";

      // Execute
      const result = mockService.getWebviewMediaUri(mockWebview, fileName);

      // Assert
      expect(result.fsPath).toBe(`/mock/webview/media/${fileName}`);
    });

    it("should return mock local resource roots", () => {
      // Execute
      const result = mockService.getWebviewLocalResourceRoots();

      // Assert
      expect(result).toHaveLength(1);
      expect(result[0].fsPath).toBe("/mock/extension/path/media");
    });

    it("should return mock icon URI", () => {
      // Setup
      const fileName = "test.png";

      // Execute
      const result = mockService.getIconUri(fileName);

      // Assert
      expect(result.fsPath).toBe(`/mock/extension/path/icons/${fileName}`);
    });
  });

  describe("Error Handling", () => {
    it("should handle disposal gracefully", () => {
      // Execute & Assert - should not throw
      expect(() => mockService.dispose()).not.toThrow();
    });
  });
});
