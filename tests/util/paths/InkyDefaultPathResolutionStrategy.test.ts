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

import { InkyDefaultPathResolutionStrategy } from "../../../src/util/paths/InkyDefaultPathResolutionStrategy";
import { mockVSCodeUri } from "../../__mocks__/mockVSCodeUri";

describe("InkyDefaultPathResolutionStrategy", () => {
  let strategy: InkyDefaultPathResolutionStrategy;

  beforeEach(() => {
    strategy = new InkyDefaultPathResolutionStrategy();
  });

  describe("resolvePath()", () => {
    it("resolves relative paths from the context file's directory", () => {
      // Setup
      const contextUri = mockVSCodeUri("/stories/main.ink");
      const parentUri = mockVSCodeUri("/stories/parent.ink");
      const path = "chapter1.ink";

      // Execute
      const result = strategy.resolvePath(contextUri, path, parentUri);

      // Assert
      expect(result).toBeDefined();
      expect(result!.fsPath).toBe("/stories/chapter1.ink");
    });

    it("resolves relative paths with subdirectories", () => {
      // Setup
      const contextUri = mockVSCodeUri("/stories/main.ink");
      const parentUri = mockVSCodeUri("/stories/parent.ink");
      const path = "chapters/chapter1.ink";

      // Execute
      const result = strategy.resolvePath(contextUri, path, parentUri);

      // Assert
      expect(result).toBeDefined();
      expect(result!.fsPath).toBe("/stories/chapters/chapter1.ink");
    });

    it("resolves relative paths with current directory prefix", () => {
      // Setup
      const contextUri = mockVSCodeUri("/stories/main.ink");
      const parentUri = mockVSCodeUri("/stories/parent.ink");
      const path = "./chapter1.ink";

      // Execute
      const result = strategy.resolvePath(contextUri, path, parentUri);

      // Assert
      expect(result).toBeDefined();
      expect(result!.fsPath).toBe("/stories/chapter1.ink");
    });

    it("resolves relative paths with parent directory prefix", () => {
      // Setup
      const contextUri = mockVSCodeUri("/stories/chapters/chapter1.ink");
      const parentUri = mockVSCodeUri("/stories/chapters/parent.ink");
      const path = "../common/shared.ink";

      // Execute
      const result = strategy.resolvePath(contextUri, path, parentUri);

      // Assert
      expect(result).toBeDefined();
      expect(result!.fsPath).toBe("/stories/common/shared.ink");
    });

    it("resolves multiple parent directory traversals", () => {
      // Setup
      const contextUri = mockVSCodeUri("/stories/chapters/sub/deep.ink");
      const parentUri = mockVSCodeUri("/stories/chapters/sub/parent.ink");
      const path = "../../common/shared.ink";

      // Execute
      const result = strategy.resolvePath(contextUri, path, parentUri);

      // Assert
      expect(result).toBeDefined();
      expect(result!.fsPath).toBe("/stories/common/shared.ink");
    });

    it("resolves complex relative paths", () => {
      // Setup
      const contextUri = mockVSCodeUri("/stories/main.ink");
      const parentUri = mockVSCodeUri("/stories/parent.ink");
      const path = "chapters/../common/shared.ink";

      // Execute
      const result = strategy.resolvePath(contextUri, path, parentUri);

      // Assert
      expect(result).toBeDefined();
      expect(result!.fsPath).toBe("/stories/common/shared.ink");
    });

    it("rejects absolute paths starting with forward slash", () => {
      // Setup
      const contextUri = mockVSCodeUri("/stories/main.ink");
      const parentUri = mockVSCodeUri("/stories/parent.ink");
      const path = "/absolute/path.ink";

      // Execute
      const result = strategy.resolvePath(contextUri, path, parentUri);

      // Assert
      expect(result).toBeNull();
    });

    it("rejects absolute paths starting with forward slash from root", () => {
      // Setup
      const contextUri = mockVSCodeUri("/main.ink");
      const parentUri = mockVSCodeUri("/parent.ink");
      const path = "/included.ink";

      // Execute
      const result = strategy.resolvePath(contextUri, path, parentUri);

      // Assert
      expect(result).toBeNull();
    });

    it("handles empty path strings", () => {
      // Setup
      const contextUri = mockVSCodeUri("/stories/main.ink");
      const parentUri = mockVSCodeUri("/stories/parent.ink");
      const path = "";

      // Execute
      const result = strategy.resolvePath(contextUri, path, parentUri);

      // Assert
      expect(result).toBeDefined();
      expect(result!.fsPath).toBe("/stories");
    });

    it("handles paths with file extensions", () => {
      // Setup
      const contextUri = mockVSCodeUri("/stories/main.ink");
      const parentUri = mockVSCodeUri("/stories/parent.ink");
      const path = "data.json";

      // Execute
      const result = strategy.resolvePath(contextUri, path, parentUri);

      // Assert
      expect(result).toBeDefined();
      expect(result!.fsPath).toBe("/stories/data.json");
    });

    it("handles paths without file extensions", () => {
      // Setup
      const contextUri = mockVSCodeUri("/stories/main.ink");
      const parentUri = mockVSCodeUri("/stories/parent.ink");
      const path = "chapter1";

      // Execute
      const result = strategy.resolvePath(contextUri, path, parentUri);

      // Assert
      expect(result).toBeDefined();
      expect(result!.fsPath).toBe("/stories/chapter1");
    });

    it("handles paths with special characters", () => {
      // Setup
      const contextUri = mockVSCodeUri("/stories/main.ink");
      const parentUri = mockVSCodeUri("/stories/parent.ink");
      const path = "special-file_name.ink";

      // Execute
      const result = strategy.resolvePath(contextUri, path, parentUri);

      // Assert
      expect(result).toBeDefined();
      expect(result!.fsPath).toBe("/stories/special-file_name.ink");
    });

    it("handles deeply nested context paths", () => {
      // Setup
      const contextUri = mockVSCodeUri(
        "/project/stories/chapters/act1/scene1.ink"
      );
      const parentUri = mockVSCodeUri(
        "/project/stories/chapters/act1/parent.ink"
      );
      const path = "scene2.ink";

      // Execute
      const result = strategy.resolvePath(contextUri, path, parentUri);

      // Assert
      expect(result).toBeDefined();
      expect(result!.fsPath).toBe("/project/stories/chapters/act1/scene2.ink");
    });

    it("handles root-level context paths", () => {
      // Setup
      const contextUri = mockVSCodeUri("/main.ink");
      const parentUri = mockVSCodeUri("/parent.ink");
      const path = "chapter1.ink";

      // Execute
      const result = strategy.resolvePath(contextUri, path, parentUri);

      // Assert
      expect(result).toBeDefined();
      expect(result!.fsPath).toBe("/chapter1.ink");
    });

    describe("fallback behavior", () => {
      it("uses contextUri when parentUri is not provided", () => {
        // Setup
        const contextUri = mockVSCodeUri("/stories/main.ink");
        const path = "chapter1.ink";

        // Execute
        const result = strategy.resolvePath(contextUri, path);

        // Assert
        expect(result).toBeDefined();
        expect(result!.fsPath).toBe("/stories/chapter1.ink");
      });

      it("uses contextUri when parentUri is undefined", () => {
        // Setup
        const contextUri = mockVSCodeUri("/stories/main.ink");
        const path = "chapter1.ink";

        // Execute
        const result = strategy.resolvePath(contextUri, path, undefined);

        // Assert
        expect(result).toBeDefined();
        expect(result!.fsPath).toBe("/stories/chapter1.ink");
      });

      it("rejects absolute paths when parentUri is not provided", () => {
        // Setup
        const contextUri = mockVSCodeUri("/stories/main.ink");
        const path = "/absolute.ink";

        // Execute
        const result = strategy.resolvePath(contextUri, path);

        // Assert
        expect(result).toBeNull();
      });

      it("handles complex paths when parentUri is not provided", () => {
        // Setup
        const contextUri = mockVSCodeUri("/stories/chapters/main.ink");
        const path = "../common/shared.ink";

        // Execute
        const result = strategy.resolvePath(contextUri, path);

        // Assert
        expect(result).toBeDefined();
        expect(result!.fsPath).toBe("/stories/common/shared.ink");
      });
    });
  });
});
