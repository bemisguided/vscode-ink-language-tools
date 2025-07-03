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
import { AdvancedPathResolutionStrategy } from "../../../src/util/paths/AdvancedPathResolutionStrategy";
import { mockVSCodeUri } from "../../__mocks__/mockVSCodeUri";

describe("AdvancedPathResolutionStrategy", () => {
  let strategy: AdvancedPathResolutionStrategy;
  let originalGetWorkspaceFolder: typeof vscode.workspace.getWorkspaceFolder;

  beforeEach(() => {
    strategy = new AdvancedPathResolutionStrategy();

    // Mock workspace.getWorkspaceFolder
    originalGetWorkspaceFolder = vscode.workspace.getWorkspaceFolder;
    (vscode.workspace as any).getWorkspaceFolder = jest.fn().mockReturnValue({
      uri: mockVSCodeUri("/workspace"),
      name: "test-workspace",
      index: 0,
    });
  });

  afterEach(() => {
    // Restore original function
    (vscode.workspace as any).getWorkspaceFolder = originalGetWorkspaceFolder;
  });

  describe("resolvePath()", () => {
    describe("relative paths", () => {
      it("resolves relative paths from the context file's directory", () => {
        // Setup
        const contextUri = mockVSCodeUri("/workspace/stories/main.ink");
        const parentUri = mockVSCodeUri("/workspace/stories/parent.ink");
        const path = "chapter1.ink";

        // Execute
        const result = strategy.resolvePath(contextUri, path, parentUri);

        // Assert
        expect(result).toBeDefined();
        expect(result!.fsPath).toBe("/workspace/stories/chapter1.ink");
      });

      it("resolves relative paths with subdirectories", () => {
        // Setup
        const contextUri = mockVSCodeUri("/workspace/stories/main.ink");
        const parentUri = mockVSCodeUri("/workspace/stories/parent.ink");
        const path = "chapters/chapter1.ink";

        // Execute
        const result = strategy.resolvePath(contextUri, path, parentUri);

        // Assert
        expect(result).toBeDefined();
        expect(result!.fsPath).toBe("/workspace/stories/chapters/chapter1.ink");
      });

      it("resolves relative paths with current directory prefix", () => {
        // Setup
        const contextUri = mockVSCodeUri("/workspace/stories/main.ink");
        const parentUri = mockVSCodeUri("/workspace/stories/parent.ink");
        const path = "./chapter1.ink";

        // Execute
        const result = strategy.resolvePath(contextUri, path, parentUri);

        // Assert
        expect(result).toBeDefined();
        expect(result!.fsPath).toBe("/workspace/stories/chapter1.ink");
      });

      it("resolves relative paths with parent directory prefix", () => {
        // Setup
        const contextUri = mockVSCodeUri(
          "/workspace/stories/chapters/chapter1.ink"
        );
        const parentUri = mockVSCodeUri(
          "/workspace/stories/chapters/parent.ink"
        );
        const path = "../common/shared.ink";

        // Execute
        const result = strategy.resolvePath(contextUri, path, parentUri);

        // Assert
        expect(result).toBeDefined();
        expect(result!.fsPath).toBe("/workspace/stories/common/shared.ink");
      });

      it("resolves multiple parent directory traversals", () => {
        // Setup
        const contextUri = mockVSCodeUri(
          "/workspace/stories/chapters/sub/deep.ink"
        );
        const parentUri = mockVSCodeUri(
          "/workspace/stories/chapters/sub/parent.ink"
        );
        const path = "../../common/shared.ink";

        // Execute
        const result = strategy.resolvePath(contextUri, path, parentUri);

        // Assert
        expect(result).toBeDefined();
        expect(result!.fsPath).toBe("/workspace/stories/common/shared.ink");
      });
    });

    describe("absolute paths", () => {
      it("resolves absolute paths from workspace root", () => {
        // Setup
        const contextUri = mockVSCodeUri("/workspace/stories/main.ink");
        const parentUri = mockVSCodeUri("/workspace/stories/parent.ink");
        const path = "/shared/common.ink";

        // Execute
        const result = strategy.resolvePath(contextUri, path, parentUri);

        // Assert
        expect(result).toBeDefined();
        expect(result!.fsPath).toBe("/workspace/shared/common.ink");
      });

      it("resolves absolute paths with multiple segments", () => {
        // Setup
        const contextUri = mockVSCodeUri("/workspace/stories/main.ink");
        const parentUri = mockVSCodeUri("/workspace/stories/parent.ink");
        const path = "/assets/data/config.json";

        // Execute
        const result = strategy.resolvePath(contextUri, path, parentUri);

        // Assert
        expect(result).toBeDefined();
        expect(result!.fsPath).toBe("/workspace/assets/data/config.json");
      });

      it("resolves absolute paths from root-level file", () => {
        // Setup
        const contextUri = mockVSCodeUri("/workspace/main.ink");
        const parentUri = mockVSCodeUri("/workspace/parent.ink");
        const path = "/chapters/chapter1.ink";

        // Execute
        const result = strategy.resolvePath(contextUri, path, parentUri);

        // Assert
        expect(result).toBeDefined();
        expect(result!.fsPath).toBe("/workspace/chapters/chapter1.ink");
      });

      it("resolves absolute paths from deeply nested context", () => {
        // Setup
        const contextUri = mockVSCodeUri(
          "/workspace/stories/chapters/act1/scene1.ink"
        );
        const parentUri = mockVSCodeUri(
          "/workspace/stories/chapters/act1/parent.ink"
        );
        const path = "/shared/common.ink";

        // Execute
        const result = strategy.resolvePath(contextUri, path, parentUri);

        // Assert
        expect(result).toBeDefined();
        expect(result!.fsPath).toBe("/workspace/shared/common.ink");
      });

      it("handles root absolute path", () => {
        // Setup
        const contextUri = mockVSCodeUri("/workspace/stories/main.ink");
        const parentUri = mockVSCodeUri("/workspace/stories/parent.ink");
        const path = "/";

        // Execute
        const result = strategy.resolvePath(contextUri, path, parentUri);

        // Assert
        expect(result).toBeDefined();
        expect(result!.fsPath).toBe("/workspace");
      });

      it("returns null when workspace folder is not available", () => {
        // Setup
        (vscode.workspace as any).getWorkspaceFolder = jest
          .fn()
          .mockReturnValue(undefined);
        const contextUri = mockVSCodeUri("/stories/main.ink");
        const parentUri = mockVSCodeUri("/stories/parent.ink");
        const path = "/shared/common.ink";

        // Execute
        const result = strategy.resolvePath(contextUri, path, parentUri);

        // Assert
        expect(result).toBeNull();
      });
    });

    describe("edge cases", () => {
      it("handles empty path strings", () => {
        // Setup
        const contextUri = mockVSCodeUri("/workspace/stories/main.ink");
        const parentUri = mockVSCodeUri("/workspace/stories/parent.ink");
        const path = "";

        // Execute
        const result = strategy.resolvePath(contextUri, path, parentUri);

        // Assert
        expect(result).toBeDefined();
        expect(result!.fsPath).toBe("/workspace/stories");
      });

      it("handles paths with file extensions", () => {
        // Setup
        const contextUri = mockVSCodeUri("/workspace/stories/main.ink");
        const parentUri = mockVSCodeUri("/workspace/stories/parent.ink");
        const path = "data.json";

        // Execute
        const result = strategy.resolvePath(contextUri, path, parentUri);

        // Assert
        expect(result).toBeDefined();
        expect(result!.fsPath).toBe("/workspace/stories/data.json");
      });

      it("handles paths without file extensions", () => {
        // Setup
        const contextUri = mockVSCodeUri("/workspace/stories/main.ink");
        const parentUri = mockVSCodeUri("/workspace/stories/parent.ink");
        const path = "chapter1";

        // Execute
        const result = strategy.resolvePath(contextUri, path, parentUri);

        // Assert
        expect(result).toBeDefined();
        expect(result!.fsPath).toBe("/workspace/stories/chapter1");
      });

      it("handles paths with special characters", () => {
        // Setup
        const contextUri = mockVSCodeUri("/workspace/stories/main.ink");
        const parentUri = mockVSCodeUri("/workspace/stories/parent.ink");
        const path = "special-file_name.ink";

        // Execute
        const result = strategy.resolvePath(contextUri, path, parentUri);

        // Assert
        expect(result).toBeDefined();
        expect(result!.fsPath).toBe("/workspace/stories/special-file_name.ink");
      });

      it("handles absolute paths with special characters", () => {
        // Setup
        const contextUri = mockVSCodeUri("/workspace/stories/main.ink");
        const parentUri = mockVSCodeUri("/workspace/stories/parent.ink");
        const path = "/special-folder_name/file.ink";

        // Execute
        const result = strategy.resolvePath(contextUri, path, parentUri);

        // Assert
        expect(result).toBeDefined();
        expect(result!.fsPath).toBe("/workspace/special-folder_name/file.ink");
      });
    });

    describe("workspace scenarios", () => {
      it("works with different workspace folder structures", () => {
        // Setup
        (vscode.workspace as any).getWorkspaceFolder = jest
          .fn()
          .mockReturnValue({
            uri: mockVSCodeUri("/different/workspace/root"),
            name: "different-workspace",
            index: 0,
          });
        const contextUri = mockVSCodeUri(
          "/different/workspace/root/stories/main.ink"
        );
        const parentUri = mockVSCodeUri(
          "/different/workspace/root/stories/parent.ink"
        );
        const path = "/assets/images/icon.png";

        // Execute
        const result = strategy.resolvePath(contextUri, path, parentUri);

        // Assert
        expect(result).toBeDefined();
        expect(result!.fsPath).toBe(
          "/different/workspace/root/assets/images/icon.png"
        );
      });

      it("handles workspace folder with complex paths", () => {
        // Setup
        (vscode.workspace as any).getWorkspaceFolder = jest
          .fn()
          .mockReturnValue({
            uri: mockVSCodeUri("/Users/developer/Projects/My Story Project"),
            name: "My Story Project",
            index: 0,
          });
        const contextUri = mockVSCodeUri(
          "/Users/developer/Projects/My Story Project/src/main.ink"
        );
        const parentUri = mockVSCodeUri(
          "/Users/developer/Projects/My Story Project/src/parent.ink"
        );
        const path = "/resources/data.json";

        // Execute
        const result = strategy.resolvePath(contextUri, path, parentUri);

        // Assert
        expect(result).toBeDefined();
        expect(result!.fsPath).toBe(
          "/Users/developer/Projects/My Story Project/resources/data.json"
        );
      });
    });

    describe("fallback behavior", () => {
      it("uses contextUri when parentUri is not provided for relative paths", () => {
        // Setup
        const contextUri = mockVSCodeUri("/workspace/stories/main.ink");
        const path = "chapter1.ink";

        // Execute
        const result = strategy.resolvePath(contextUri, path);

        // Assert
        expect(result).toBeDefined();
        expect(result!.fsPath).toBe("/workspace/stories/chapter1.ink");
      });

      it("uses contextUri when parentUri is undefined for relative paths", () => {
        // Setup
        const contextUri = mockVSCodeUri("/workspace/stories/main.ink");
        const path = "chapter1.ink";

        // Execute
        const result = strategy.resolvePath(contextUri, path, undefined);

        // Assert
        expect(result).toBeDefined();
        expect(result!.fsPath).toBe("/workspace/stories/chapter1.ink");
      });

      it("handles absolute paths when parentUri is not provided", () => {
        // Setup
        const contextUri = mockVSCodeUri("/workspace/stories/main.ink");
        const path = "/shared/common.ink";

        // Execute
        const result = strategy.resolvePath(contextUri, path);

        // Assert
        expect(result).toBeDefined();
        expect(result!.fsPath).toBe("/workspace/shared/common.ink");
      });

      it("handles complex relative paths when parentUri is not provided", () => {
        // Setup
        const contextUri = mockVSCodeUri(
          "/workspace/stories/chapters/main.ink"
        );
        const path = "../common/shared.ink";

        // Execute
        const result = strategy.resolvePath(contextUri, path);

        // Assert
        expect(result).toBeDefined();
        expect(result!.fsPath).toBe("/workspace/stories/common/shared.ink");
      });

      it("returns null when workspace folder is not available and parentUri is not provided", () => {
        // Setup
        (vscode.workspace as any).getWorkspaceFolder = jest
          .fn()
          .mockReturnValue(undefined);
        const contextUri = mockVSCodeUri("/stories/main.ink");
        const path = "/shared/common.ink";

        // Execute
        const result = strategy.resolvePath(contextUri, path);

        // Assert
        expect(result).toBeNull();
      });
    });
  });
});
