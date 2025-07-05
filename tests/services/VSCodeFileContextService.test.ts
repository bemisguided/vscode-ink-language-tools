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
import {
  VSCodeFileContextServiceImpl,
  FileType,
  FileResolutionContext,
  FileResolutionResult,
} from "../../src/services/VSCodeFileContextService";

describe("VSCodeFileContextService", () => {
  let service: VSCodeFileContextServiceImpl;
  let mockUri: vscode.Uri;
  let mockInkUri: vscode.Uri;
  let mockJsUri: vscode.Uri;
  let mockTxtUri: vscode.Uri;
  let mockTextDocuments: vscode.TextDocument[];

  beforeEach(() => {
    service = new VSCodeFileContextServiceImpl();
    mockUri = vscode.Uri.file("/test/path/story.ink");
    mockInkUri = vscode.Uri.file("/test/path/story.ink");
    mockJsUri = vscode.Uri.file("/test/path/script.js");
    mockTxtUri = vscode.Uri.file("/test/path/readme.txt");
    mockTextDocuments = [];

    // Mock vscode.workspace.textDocuments
    Object.defineProperty(vscode.workspace, "textDocuments", {
      get: () => mockTextDocuments,
      configurable: true,
    });

    // Mock vscode.window.activeTextEditor
    Object.defineProperty(vscode.window, "activeTextEditor", {
      get: () => undefined,
      configurable: true,
    });
  });

  describe("isValidFile", () => {
    describe("Ink files", () => {
      it("should return true for .ink files", async () => {
        const result = await service.isValidFile(FileType.ink, mockInkUri);
        expect(result).toBe(true);
      });

      it("should return false for non-.ink files", async () => {
        const result = await service.isValidFile(FileType.ink, mockJsUri);
        expect(result).toBe(false);
      });

      it("should return false for files without extension", async () => {
        const noExtUri = vscode.Uri.file("/test/path/readme");
        const result = await service.isValidFile(FileType.ink, noExtUri);
        expect(result).toBe(false);
      });

      it("should validate language ID for open documents", async () => {
        const mockDoc = {
          uri: mockInkUri,
          languageId: "ink",
        } as vscode.TextDocument;
        mockTextDocuments.push(mockDoc);

        const result = await service.isValidFile(FileType.ink, mockInkUri);
        expect(result).toBe(true);
      });

      it("should return false for open documents with wrong language ID", async () => {
        const mockDoc = {
          uri: mockInkUri,
          languageId: "text",
        } as vscode.TextDocument;
        mockTextDocuments.push(mockDoc);

        const result = await service.isValidFile(FileType.ink, mockInkUri);
        expect(result).toBe(false);
      });
    });

    describe("JavaScript files", () => {
      it("should return true for .js files", async () => {
        const result = await service.isValidFile(
          FileType.javaScript,
          mockJsUri
        );
        expect(result).toBe(true);
      });

      it("should return true for .ts files", async () => {
        const tsUri = vscode.Uri.file("/test/path/script.ts");
        const result = await service.isValidFile(FileType.javaScript, tsUri);
        expect(result).toBe(true);
      });

      it("should return true for .jsx files", async () => {
        const jsxUri = vscode.Uri.file("/test/path/component.jsx");
        const result = await service.isValidFile(FileType.javaScript, jsxUri);
        expect(result).toBe(true);
      });

      it("should return true for .tsx files", async () => {
        const tsxUri = vscode.Uri.file("/test/path/component.tsx");
        const result = await service.isValidFile(FileType.javaScript, tsxUri);
        expect(result).toBe(true);
      });

      it("should return false for non-JavaScript files", async () => {
        const result = await service.isValidFile(
          FileType.javaScript,
          mockInkUri
        );
        expect(result).toBe(false);
      });
    });

    it("should handle errors gracefully", async () => {
      // Mock a URI that would cause an error
      const errorUri = {} as vscode.Uri;
      const result = await service.isValidFile(FileType.ink, errorUri);
      expect(result).toBe(false);
    });
  });

  describe("getResolutionContext", () => {
    it("should return multiSelection for multiple URIs", () => {
      const context = service.getResolutionContext(undefined, [
        mockInkUri,
        mockJsUri,
      ]);
      expect(context).toBe(FileResolutionContext.multiSelection);
    });

    it("should return singleSelection for single URI", () => {
      const context = service.getResolutionContext(mockInkUri, undefined);
      expect(context).toBe(FileResolutionContext.singleSelection);
    });

    it("should return activeEditor for no URIs", () => {
      const context = service.getResolutionContext(undefined, undefined);
      expect(context).toBe(FileResolutionContext.activeEditor);
    });

    it("should prioritize uris over uri", () => {
      const context = service.getResolutionContext(mockInkUri, [mockJsUri]);
      expect(context).toBe(FileResolutionContext.multiSelection);
    });
  });

  describe("resolveFiles", () => {
    it("should return empty result when no files are found", async () => {
      const result = await service.resolveFiles(FileType.ink);
      expect(result).toEqual({
        validFiles: [],
        invalidFiles: [],
        hasSelection: false,
      });
    });

    it("should resolve valid Ink files from single URI", async () => {
      const result = await service.resolveFiles(FileType.ink, mockInkUri);
      expect(result).toEqual({
        validFiles: [mockInkUri],
        invalidFiles: [],
        hasSelection: true,
      });
    });

    it("should resolve valid JavaScript files from single URI", async () => {
      const result = await service.resolveFiles(FileType.javaScript, mockJsUri);
      expect(result).toEqual({
        validFiles: [mockJsUri],
        invalidFiles: [],
        hasSelection: true,
      });
    });

    it("should identify invalid files", async () => {
      const result = await service.resolveFiles(FileType.ink, mockTxtUri);
      expect(result.validFiles).toEqual([]);
      expect(result.invalidFiles).toHaveLength(1);
      expect(result.invalidFiles[0].uri).toBe(mockTxtUri);
      expect(result.invalidFiles[0].reason).toBe("Invalid extension: .txt");
      expect(result.hasSelection).toBe(true);
    });

    it("should handle mixed valid and invalid files", async () => {
      const result = await service.resolveFiles(FileType.ink, undefined, [
        mockInkUri,
        mockJsUri,
        mockTxtUri,
      ]);
      expect(result.validFiles).toEqual([mockInkUri]);
      expect(result.invalidFiles).toHaveLength(2);
      expect(result.hasSelection).toBe(true);
    });

    it("should use active editor when no parameters provided", async () => {
      const mockEditor = {
        document: {
          uri: mockInkUri,
        },
      } as vscode.TextEditor;

      Object.defineProperty(vscode.window, "activeTextEditor", {
        get: () => mockEditor,
        configurable: true,
      });

      const result = await service.resolveFiles(FileType.ink);
      expect(result.validFiles).toEqual([mockInkUri]);
      expect(result.hasSelection).toBe(true);
    });
  });

  describe("resolveSingleFile", () => {
    it("should return error when no files are found", async () => {
      const result = await service.resolveSingleFile(FileType.ink);
      expect(result).toEqual({
        hasSelection: false,
        errorMessage: "No active document or selected file.",
      });
    });

    it("should resolve single valid Ink file", async () => {
      const result = await service.resolveSingleFile(FileType.ink, mockInkUri);
      expect(result).toEqual({
        validFile: mockInkUri,
        hasSelection: true,
      });
    });

    it("should resolve single valid JavaScript file", async () => {
      const result = await service.resolveSingleFile(
        FileType.javaScript,
        mockJsUri
      );
      expect(result).toEqual({
        validFile: mockJsUri,
        hasSelection: true,
      });
    });

    it("should return error for single invalid file", async () => {
      const result = await service.resolveSingleFile(FileType.ink, mockTxtUri);
      expect(result.validFile).toBeUndefined();
      expect(result.hasSelection).toBe(true);
      expect(result.errorMessage).toBe(
        "Selected file is not an Ink story: readme.txt"
      );
    });

    it("should return first valid file from multiple valid files with warning", async () => {
      const secondInkUri = vscode.Uri.file("/test/path/story2.ink");
      const result = await service.resolveSingleFile(FileType.ink, undefined, [
        mockInkUri,
        secondInkUri,
      ]);
      expect(result.validFile).toBe(mockInkUri);
      expect(result.hasSelection).toBe(true);
      expect(result.warningMessage).toBe(
        "2 Ink storys selected. Using first: story.ink"
      );
    });

    it("should return first valid file from mixed files with warning", async () => {
      const result = await service.resolveSingleFile(FileType.ink, undefined, [
        mockTxtUri,
        mockInkUri,
        mockJsUri,
      ]);
      expect(result.validFile).toBe(mockInkUri);
      expect(result.hasSelection).toBe(true);
      expect(result.warningMessage).toBe(
        "2 selected files are not Ink storys: readme.txt, script.js. Using first valid Ink story: story.ink"
      );
    });

    it("should return error for multiple invalid files", async () => {
      const result = await service.resolveSingleFile(FileType.ink, undefined, [
        mockTxtUri,
        mockJsUri,
      ]);
      expect(result.validFile).toBeUndefined();
      expect(result.hasSelection).toBe(true);
      expect(result.errorMessage).toBe(
        "2 selected files are not Ink storys: readme.txt, script.js"
      );
    });

    it("should use active editor when no parameters provided", async () => {
      const mockEditor = {
        document: {
          uri: mockInkUri,
        },
      } as vscode.TextEditor;

      Object.defineProperty(vscode.window, "activeTextEditor", {
        get: () => mockEditor,
        configurable: true,
      });

      const result = await service.resolveSingleFile(FileType.ink);
      expect(result.validFile).toBe(mockInkUri);
      expect(result.hasSelection).toBe(true);
    });

    it("should throw error for unsupported file type", async () => {
      const unsupportedType = "unsupported" as FileType;
      await expect(
        service.resolveSingleFile(unsupportedType, mockUri)
      ).rejects.toThrow("Unsupported file type: unsupported");
    });
  });

  describe("formatResolutionMessages", () => {
    describe("Ink files", () => {
      it("should format error message for no selection", () => {
        const result: FileResolutionResult = {
          validFiles: [],
          invalidFiles: [],
          hasSelection: false,
        };
        const messages = service.formatResolutionMessages(FileType.ink, result);
        expect(messages.errorMessage).toBe(
          "No active document or selected file."
        );
        expect(messages.warningMessage).toBeUndefined();
      });

      it("should format error message for single invalid file", () => {
        const result: FileResolutionResult = {
          validFiles: [],
          invalidFiles: [{ uri: mockTxtUri, reason: "Invalid extension" }],
          hasSelection: true,
        };
        const messages = service.formatResolutionMessages(FileType.ink, result);
        expect(messages.errorMessage).toBe(
          "Selected file is not an Ink story: readme.txt"
        );
        expect(messages.warningMessage).toBeUndefined();
      });

      it("should format error message for multiple invalid files", () => {
        const result: FileResolutionResult = {
          validFiles: [],
          invalidFiles: [
            { uri: mockTxtUri, reason: "Invalid extension" },
            { uri: mockJsUri, reason: "Invalid extension" },
          ],
          hasSelection: true,
        };
        const messages = service.formatResolutionMessages(FileType.ink, result);
        expect(messages.errorMessage).toBe(
          "2 selected files are not Ink storys: readme.txt, script.js"
        );
        expect(messages.warningMessage).toBeUndefined();
      });

      it("should format warning message for mixed valid and invalid files", () => {
        const result: FileResolutionResult = {
          validFiles: [mockInkUri],
          invalidFiles: [{ uri: mockTxtUri, reason: "Invalid extension" }],
          hasSelection: true,
        };
        const messages = service.formatResolutionMessages(FileType.ink, result);
        expect(messages.warningMessage).toBe(
          "Selected file is not an Ink story: readme.txt. Processing 1 valid Ink story."
        );
        expect(messages.errorMessage).toBeUndefined();
      });

      it("should format warning message for multiple mixed files", () => {
        const result: FileResolutionResult = {
          validFiles: [mockInkUri, vscode.Uri.file("/test/other.ink")],
          invalidFiles: [
            { uri: mockTxtUri, reason: "Invalid extension" },
            { uri: mockJsUri, reason: "Invalid extension" },
          ],
          hasSelection: true,
        };
        const messages = service.formatResolutionMessages(FileType.ink, result);
        expect(messages.warningMessage).toBe(
          "2 selected files are not Ink storys: readme.txt, script.js. Processing 2 valid Ink storys."
        );
        expect(messages.errorMessage).toBeUndefined();
      });

      it("should return empty messages for all valid files", () => {
        const result: FileResolutionResult = {
          validFiles: [mockInkUri],
          invalidFiles: [],
          hasSelection: true,
        };
        const messages = service.formatResolutionMessages(FileType.ink, result);
        expect(messages.errorMessage).toBeUndefined();
        expect(messages.warningMessage).toBeUndefined();
      });
    });

    describe("JavaScript files", () => {
      it("should format error message for single invalid JavaScript file", () => {
        const result: FileResolutionResult = {
          validFiles: [],
          invalidFiles: [{ uri: mockTxtUri, reason: "Invalid extension" }],
          hasSelection: true,
        };
        const messages = service.formatResolutionMessages(
          FileType.javaScript,
          result
        );
        expect(messages.errorMessage).toBe(
          "Selected file is not a JavaScript file: readme.txt"
        );
        expect(messages.warningMessage).toBeUndefined();
      });

      it("should format error message for multiple invalid JavaScript files", () => {
        const result: FileResolutionResult = {
          validFiles: [],
          invalidFiles: [
            { uri: mockTxtUri, reason: "Invalid extension" },
            { uri: mockInkUri, reason: "Invalid extension" },
          ],
          hasSelection: true,
        };
        const messages = service.formatResolutionMessages(
          FileType.javaScript,
          result
        );
        expect(messages.errorMessage).toBe(
          "2 selected files are not JavaScript files: readme.txt, story.ink"
        );
        expect(messages.warningMessage).toBeUndefined();
      });
    });
  });

  describe("error handling", () => {
    it("should return false for unsupported file type in isValidFile", async () => {
      const unsupportedType = "unsupported" as FileType;
      const result = await service.isValidFile(unsupportedType, mockUri);
      expect(result).toBe(false);
    });

    it("should throw error for unsupported file type in formatResolutionMessages", () => {
      const unsupportedType = "unsupported" as FileType;
      const result: FileResolutionResult = {
        validFiles: [],
        invalidFiles: [],
        hasSelection: false,
      };
      expect(() =>
        service.formatResolutionMessages(unsupportedType, result)
      ).toThrow("Unsupported file type: unsupported");
    });

    it("should throw error for unsupported file type in resolveFiles", async () => {
      const unsupportedType = "unsupported" as FileType;
      await expect(
        service.resolveFiles(unsupportedType, mockUri)
      ).rejects.toThrow("Unsupported file type: unsupported");
    });
  });
});
