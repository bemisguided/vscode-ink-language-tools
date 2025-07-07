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
import { VSCodeWorkspaceNavigationServiceImpl } from "../../src/services/VSCodeWorkspaceNavigationService";
import { MockWorkspaceNavigationService } from "../__mocks__/MockWorkspaceNavigationService";
import { VSCodeServiceLocator } from "../../src/services/VSCodeServiceLocator";

describe("VSCodeWorkspaceNavigationService", () => {
  let service: VSCodeWorkspaceNavigationServiceImpl;
  let mockService: MockWorkspaceNavigationService;
  let mockPanel: any;
  let mockPanel2: any;

  beforeEach(() => {
    service = new VSCodeWorkspaceNavigationServiceImpl();
    mockService = new MockWorkspaceNavigationService();

    // Setup common mock panels
    mockPanel = {
      onDidDispose: jest.fn(),
      dispose: jest.fn(),
    };
    mockPanel2 = {
      onDidDispose: jest.fn(),
      dispose: jest.fn(),
    };

    // Clear service locator state
    VSCodeServiceLocator.setWorkspaceNavigationService(service);
  });

  afterEach(() => {
    service.dispose();
    mockService.dispose();
  });

  describe("Service Locator Integration", () => {
    it("should be accessible through service locator", () => {
      // Execute
      const serviceFromLocator =
        VSCodeServiceLocator.getWorkspaceNavigationService();

      // Assert
      expect(serviceFromLocator).toBeInstanceOf(
        VSCodeWorkspaceNavigationServiceImpl
      );
    });

    it("should support mock injection", () => {
      // Setup
      VSCodeServiceLocator.setWorkspaceNavigationService(mockService);

      // Execute
      const serviceFromLocator =
        VSCodeServiceLocator.getWorkspaceNavigationService();

      // Assert
      expect(serviceFromLocator).toBe(mockService);
    });

    it("should return singleton instance", () => {
      // Execute
      const service1 = VSCodeServiceLocator.getWorkspaceNavigationService();
      const service2 = VSCodeServiceLocator.getWorkspaceNavigationService();

      // Assert
      expect(service1).toBe(service2);
    });
  });

  describe("registerPanel()", () => {
    it("should register panel and track it in registry", () => {
      // Setup
      const panelId = "test-panel";
      mockPanel.onDidDispose.mockImplementation(() => {});

      // Execute
      service.registerPanel(panelId, mockPanel);

      // Assert
      expect(service.isPanelOpen(panelId)).toBe(true);
      expect(mockPanel.onDidDispose).toHaveBeenCalled();
    });

    it("should auto-unregister panel when disposed", () => {
      // Setup
      const panelId = "test-panel";
      let disposeCallback: () => void;
      mockPanel.onDidDispose.mockImplementation((callback: () => void) => {
        disposeCallback = callback;
      });
      service.registerPanel(panelId, mockPanel);
      expect(service.isPanelOpen(panelId)).toBe(true);

      // Execute
      disposeCallback!();

      // Assert
      expect(service.isPanelOpen(panelId)).toBe(false);
    });
  });

  describe("unregisterPanel()", () => {
    it("should manually remove panel from registry", () => {
      // Setup
      const panelId = "test-panel";
      mockPanel.onDidDispose.mockImplementation(() => {});
      service.registerPanel(panelId, mockPanel);
      expect(service.isPanelOpen(panelId)).toBe(true);

      // Execute
      service.unregisterPanel(panelId);

      // Assert
      expect(service.isPanelOpen(panelId)).toBe(false);
    });

    it("should handle unregistering non-existent panel gracefully", () => {
      // Setup
      const panelId = "nonexistent-panel";

      // Execute & Assert - should not throw
      expect(() => service.unregisterPanel(panelId)).not.toThrow();
    });
  });

  describe("isPanelOpen()", () => {
    it("should return true for registered panel", () => {
      // Setup
      const panelId = "test-panel";
      mockPanel.onDidDispose.mockImplementation(() => {});
      service.registerPanel(panelId, mockPanel);

      // Execute
      const result = service.isPanelOpen(panelId);

      // Assert
      expect(result).toBe(true);
    });

    it("should return false for unregistered panel", () => {
      // Setup
      const panelId = "nonexistent-panel";

      // Execute
      const result = service.isPanelOpen(panelId);

      // Assert
      expect(result).toBe(false);
    });
  });

  describe("focusWebviewPanel()", () => {
    it("should focus existing panel", async () => {
      // Setup
      const panelId = "test-panel";
      mockPanel.reveal = jest.fn();
      mockPanel.onDidDispose.mockImplementation(() => {});
      service.registerPanel(panelId, mockPanel);

      // Execute
      const result = await service.focusWebviewPanel(panelId);

      // Assert
      expect(result).toBe(mockPanel);
      expect(mockPanel.reveal).toHaveBeenCalled();
    });

    it("should return undefined for non-existent panel", async () => {
      // Setup
      const panelId = "nonexistent-panel";

      // Execute
      const result = await service.focusWebviewPanel(panelId);

      // Assert
      expect(result).toBeUndefined();
    });
  });

  describe("openAndFocusWebviewPanel()", () => {
    it("should focus existing panel if already open", async () => {
      // Setup
      const panelId = "test-panel";
      mockPanel.reveal = jest.fn();
      mockPanel.onDidDispose.mockImplementation(() => {});
      service.registerPanel(panelId, mockPanel);

      // Execute
      const result = await service.openAndFocusWebviewPanel(
        panelId,
        vscode.ViewColumn.Beside
      );

      // Assert
      expect(result).toBe(mockPanel);
      expect(mockPanel.reveal).toHaveBeenCalled();
    });

    it("should return undefined if panel not registered", async () => {
      // Setup
      const panelId = "nonexistent-panel";

      // Execute
      const result = await service.openAndFocusWebviewPanel(
        panelId,
        vscode.ViewColumn.Beside
      );

      // Assert
      expect(result).toBeUndefined();
    });
  });

  describe("closePanel()", () => {
    it("should dispose existing panel", async () => {
      // Setup
      const panelId = "test-panel";
      mockPanel.onDidDispose.mockImplementation(() => {});
      service.registerPanel(panelId, mockPanel);

      // Execute
      await service.closePanel(panelId);

      // Assert
      expect(mockPanel.dispose).toHaveBeenCalled();
    });

    it("should handle closing non-existent panel gracefully", async () => {
      // Setup
      const panelId = "nonexistent-panel";

      // Execute & Assert - should not throw
      await expect(service.closePanel(panelId)).resolves.toBeUndefined();
    });
  });

  describe("dispose()", () => {
    it("should dispose all registered panels", () => {
      // Setup
      const panelId1 = "test-panel-1";
      const panelId2 = "test-panel-2";
      mockPanel.onDidDispose.mockImplementation(() => {});
      mockPanel2.onDidDispose.mockImplementation(() => {});
      service.registerPanel(panelId1, mockPanel);
      service.registerPanel(panelId2, mockPanel2);

      // Execute
      service.dispose();

      // Assert
      expect(mockPanel.dispose).toHaveBeenCalled();
      expect(mockPanel2.dispose).toHaveBeenCalled();
      expect(service.isPanelOpen(panelId1)).toBe(false);
      expect(service.isPanelOpen(panelId2)).toBe(false);
    });

    it("should clear registry after disposal", () => {
      // Setup
      const panelId = "test-panel";
      mockPanel.onDidDispose.mockImplementation(() => {});
      service.registerPanel(panelId, mockPanel);
      expect(service.isPanelOpen(panelId)).toBe(true);

      // Execute
      service.dispose();

      // Assert
      expect(service.isPanelOpen(panelId)).toBe(false);
    });
  });
});

describe("MockWorkspaceNavigationService", () => {
  let mockService: MockWorkspaceNavigationService;

  beforeEach(() => {
    mockService = new MockWorkspaceNavigationService();
  });

  afterEach(() => {
    mockService.dispose();
  });

  describe("Call Logging", () => {
    it("should track method calls with parameters", () => {
      // Setup
      const panelId = "test-panel";

      // Execute
      mockService.isPanelOpen(panelId);

      // Assert
      const callLog = mockService.getCallLog();
      expect(callLog).toContain("isPanelOpen(test-panel)");
    });

    it("should clear call log when requested", () => {
      // Setup
      mockService.isPanelOpen("test-panel");
      expect(mockService.getCallLog()).toHaveLength(1);

      // Execute
      mockService.clearCallLog();

      // Assert
      expect(mockService.getCallLog()).toHaveLength(0);
    });
  });

  describe("Panel Simulation", () => {
    it("should simulate opening and tracking panels", async () => {
      // Setup
      const panelId = "test-panel";
      expect(mockService.isPanelOpen(panelId)).toBe(false);

      // Execute
      const panel = await mockService.openAndFocusWebviewPanel(
        panelId,
        vscode.ViewColumn.Beside
      );

      // Assert
      expect(panel).toBeDefined();
      expect(panel!.title).toBe(`Mock Panel ${panelId}`);
      expect(mockService.isPanelOpen(panelId)).toBe(true);
    });

    it("should return same panel when focusing existing panel", async () => {
      // Setup
      const panelId = "test-panel";
      const openedPanel = await mockService.openAndFocusWebviewPanel(
        panelId,
        vscode.ViewColumn.Beside
      );

      // Execute
      const focusedPanel = await mockService.focusWebviewPanel(panelId);

      // Assert
      expect(focusedPanel).toBe(openedPanel);
    });

    it("should simulate panel creation with mock methods", () => {
      // Setup & Execute
      const panel = mockService.mockOpenPanel(
        "test-panel",
        vscode.ViewColumn.One
      );

      // Assert
      expect(panel.title).toBe("Mock Panel test-panel");
      expect(mockService.isPanelOpen("test-panel")).toBe(true);

      const openPanels = mockService.getOpenPanels();
      expect(openPanels.size).toBe(1);
    });
  });

  describe("Error Handling", () => {
    it("should return undefined for non-existent panel operations", async () => {
      // Setup
      const panelId = "nonexistent-panel";

      // Execute
      const panel = await mockService.focusWebviewPanel(panelId);

      // Assert
      expect(panel).toBeUndefined();
    });

    it("should handle disposal gracefully", () => {
      // Setup
      mockService.mockOpenPanel("test-panel", vscode.ViewColumn.One);
      expect(mockService.isPanelOpen("test-panel")).toBe(true);

      // Execute
      mockService.dispose();

      // Assert
      expect(mockService.isPanelOpen("test-panel")).toBe(false);
      expect(mockService.getOpenPanels().size).toBe(0);
    });
  });
});
