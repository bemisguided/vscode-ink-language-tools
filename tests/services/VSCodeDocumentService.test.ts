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
import { VSCodeDocumentServiceImpl } from "../../src/services/VSCodeDocumentService";
import { mockVSCodeUri } from "../__mocks__/mockVSCodeUri";
import { MockVSCodeConfigurationService } from "../__mocks__/MockVSCodeConfigurationService";

describe("VSCodeDocumentService", () => {
  let service: VSCodeDocumentServiceImpl;
  let mockWorkspaceFolder: vscode.WorkspaceFolder;
  let mockConfigService: MockVSCodeConfigurationService;
  let getWorkspaceFolderSpy: jest.SpyInstance;

  beforeEach(() => {
    mockConfigService = new MockVSCodeConfigurationService();
    service = new VSCodeDocumentServiceImpl(mockConfigService);
    mockWorkspaceFolder = {
      uri: mockVSCodeUri("/workspace"),
      name: "test-workspace",
      index: 0,
    };

    // Common setup for workspace folder mock
    getWorkspaceFolderSpy = jest
      .spyOn(service, "getWorkspaceFolder")
      .mockReturnValue(mockWorkspaceFolder);
  });

  afterEach(() => {
    getWorkspaceFolderSpy.mockRestore();
  });

  describe("resolveSourceRootUri()", () => {
    const testUri = mockVSCodeUri("/workspace/story.ink");

    it("should return workspace root when sourceRoot is empty", () => {
      // Execute
      const result = service.resolveSourceRootUri(testUri);

      // Assert
      expect(result).toEqual(mockWorkspaceFolder.uri);
    });

    it("should return workspace root when sourceRoot is whitespace", () => {
      // Setup
      mockConfigService.mockSettings["ink.compile.behaviour.sourceRoot"] = "  ";

      // Execute
      const result = service.resolveSourceRootUri(testUri);

      // Assert
      expect(result).toEqual(mockWorkspaceFolder.uri);
    });

    it("should resolve sourceRoot relative to workspace root", () => {
      // Setup
      mockConfigService.mockSettings["ink.compile.behaviour.sourceRoot"] =
        "src";

      // Execute
      const result = service.resolveSourceRootUri(testUri);

      // Assert
      expect(result).toEqual(mockVSCodeUri("/workspace/src"));
    });

    it("should resolve nested sourceRoot paths", () => {
      // Setup
      mockConfigService.mockSettings["ink.compile.behaviour.sourceRoot"] =
        "src/stories";

      // Execute
      const result = service.resolveSourceRootUri(testUri);

      // Assert
      expect(result).toEqual(mockVSCodeUri("/workspace/src/stories"));
    });

    it("should return the workspace root and log warning for absolute paths", () => {
      // Setup
      mockConfigService.mockSettings["ink.compile.behaviour.sourceRoot"] =
        "/abs/path";
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

      // Execute
      const result = service.resolveSourceRootUri(testUri);

      // Assert
      expect(result).toEqual(mockWorkspaceFolder.uri);
      expect(consoleSpy).toHaveBeenCalledWith(
        "[VSCodeDocumentService] Invalid sourceRoot path: /abs/path. Must be relative and not escape workspace."
      );
      consoleSpy.mockRestore();
    });

    it("should return workspace root and log warning for paths with parent directory traversal", () => {
      // Setup
      mockConfigService.mockSettings["ink.compile.behaviour.sourceRoot"] =
        "src/../../../escape";
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

      // Execute
      const result = service.resolveSourceRootUri(testUri);

      // Assert
      expect(result).toEqual(mockWorkspaceFolder.uri);
      expect(consoleSpy).toHaveBeenCalledWith(
        "[VSCodeDocumentService] Invalid sourceRoot path: src/../../../escape. Must be relative and not escape workspace."
      );
      consoleSpy.mockRestore();
    });

    it("should handle single parent directory reference", () => {
      // Setup
      mockConfigService.mockSettings["ink.compile.behaviour.sourceRoot"] =
        "src/..";
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();

      // Execute
      const result = service.resolveSourceRootUri(testUri);

      // Assert
      expect(result).toEqual(mockWorkspaceFolder.uri);
      expect(consoleSpy).toHaveBeenCalledWith(
        "[VSCodeDocumentService] Invalid sourceRoot path: src/... Must be relative and not escape workspace."
      );
      consoleSpy.mockRestore();
    });

    it("should handle complex valid paths", () => {
      // Setup
      mockConfigService.mockSettings["ink.compile.behaviour.sourceRoot"] =
        "assets/stories/chapters";

      // Execute
      const result = service.resolveSourceRootUri(testUri);

      // Assert
      expect(result).toEqual(
        mockVSCodeUri("/workspace/assets/stories/chapters")
      );
    });
  });

  describe("resolveOutputFileUri()", () => {
    const testInputFile = mockVSCodeUri("/workspace/story.ink");

    it("should resolve output file with default directory", () => {
      // Execute
      const result = service.resolveOutputFileUri(testInputFile, "json");

      // Assert
      expect(result).toEqual(mockVSCodeUri("/workspace/out/story.json"));
    });

    it("should resolve output file with configured directory", () => {
      // Setup
      mockConfigService.mockSettings["ink.compile.output.directory"] = "dist";

      // Execute
      const result = service.resolveOutputFileUri(testInputFile, "json");

      // Assert
      expect(result).toEqual(mockVSCodeUri("/workspace/dist/story.json"));
    });

    it("should resolve output file with nested directory", () => {
      // Setup
      mockConfigService.mockSettings["ink.compile.output.directory"] =
        "build/output";

      // Execute
      const result = service.resolveOutputFileUri(testInputFile, "json");

      // Assert
      expect(result).toEqual(
        mockVSCodeUri("/workspace/build/output/story.json")
      );
    });

    it("should handle different file extensions", () => {
      // Setup
      mockConfigService.mockSettings["ink.compile.output.directory"] = "build";

      // Execute
      const htmlResult = service.resolveOutputFileUri(testInputFile, "html");
      const jsResult = service.resolveOutputFileUri(testInputFile, "js");

      // Assert
      expect(htmlResult).toEqual(mockVSCodeUri("/workspace/build/story.html"));
      expect(jsResult).toEqual(mockVSCodeUri("/workspace/build/story.js"));
    });

    it("should strip original extension when creating output filename", () => {
      // Setup
      const inputWithExtension = mockVSCodeUri("/workspace/path/my-story.ink");
      mockConfigService.mockSettings["ink.compile.output.directory"] = "output";

      // Execute
      const result = service.resolveOutputFileUri(inputWithExtension, "json");

      // Assert
      expect(result).toEqual(mockVSCodeUri("/workspace/output/my-story.json"));
    });

    it("should handle files in subdirectories", () => {
      // Setup
      const nestedInput = mockVSCodeUri(
        "/workspace/stories/chapter1/part1.ink"
      );
      mockConfigService.mockSettings["ink.compile.output.directory"] =
        "compiled";

      // Execute
      const result = service.resolveOutputFileUri(nestedInput, "json");

      // Assert
      expect(result).toEqual(mockVSCodeUri("/workspace/compiled/part1.json"));
    });

    it("should handle empty output directory configuration", () => {
      // Setup
      mockConfigService.mockSettings["ink.compile.output.directory"] = "";

      // Execute
      const result = service.resolveOutputFileUri(testInputFile, "json");

      // Assert
      expect(result).toEqual(mockVSCodeUri("/workspace/story.json"));
    });

    it("should use configuration scope correctly", () => {
      // Setup - this test verifies that the configuration is read with the correct URI scope
      const configGetSpy = jest.spyOn(mockConfigService, "get");

      // Execute
      service.resolveOutputFileUri(testInputFile, "json");

      // Assert
      expect(configGetSpy).toHaveBeenCalledWith(
        "ink.compile.output.directory",
        "out",
        testInputFile
      );

      configGetSpy.mockRestore();
    });
  });
});
