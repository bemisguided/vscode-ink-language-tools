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
import * as path from "path";

/**
 * Supported file types for context operations.
 */
export enum FileType {
  ink = "ink",
  javaScript = "javascript",
}

/**
 * Result of resolving files from various contexts.
 */
export interface FileResolutionResult {
  /** Successfully resolved file URIs */
  validFiles: vscode.Uri[];
  /** Files that were selected but are not valid for the specified type */
  invalidFiles: { uri: vscode.Uri; reason: string }[];
  /** Whether any files were found at all */
  hasSelection: boolean;
}

/**
 * Context information about how files were resolved.
 */
export enum FileResolutionContext {
  multiSelection = "multi-selection",
  singleSelection = "single-selection",
  activeEditor = "active-editor",
}

/**
 * Configuration for a specific file type.
 */
interface FileTypeConfig {
  /** File extensions (including dot) */
  extensions: string[];
  /** VSCode language ID */
  languageId: string;
  /** Display name for error messages */
  displayName: string;
}

/**
 * Service for handling file operations including resolution, validation, and metadata for different file types.
 */
export interface IVSCodeFileContextService {
  /**
   * Resolve files of a specific type from various VSCode contexts (explorer, editor tabs, active editor).
   * @param fileType The type of files to resolve
   * @param uri Single URI (from context menu or single selection)
   * @param uris Multiple URIs (from multi-selection in explorer)
   * @returns Resolution result with valid/invalid files and context information
   */
  resolveFiles(
    fileType: FileType,
    uri?: vscode.Uri,
    uris?: vscode.Uri[]
  ): Promise<FileResolutionResult>;

  /**
   * Check if a URI represents a valid file of the specified type.
   * @param fileType The type of file to validate
   * @param uri The URI to validate
   * @returns True if the file is a valid file of the specified type
   */
  isValidFile(fileType: FileType, uri: vscode.Uri): Promise<boolean>;

  /**
   * Get the resolution context that was used to find files.
   * @param uri Single URI parameter
   * @param uris Multiple URI parameter
   * @returns The context that would be used for resolution
   */
  getResolutionContext(
    uri?: vscode.Uri,
    uris?: vscode.Uri[]
  ): FileResolutionContext;

  /**
   * Format user-friendly messages for resolution results.
   * @param fileType The type of files that were resolved
   * @param result The resolution result
   * @returns Formatted error/warning messages for display
   */
  formatResolutionMessages(
    fileType: FileType,
    result: FileResolutionResult
  ): {
    errorMessage?: string;
    warningMessage?: string;
  };
}

/**
 * Implementation of the VSCodeFileContextService.
 */
export class VSCodeFileContextServiceImpl implements IVSCodeFileContextService {
  // Private Properties ===============================================================================================

  /** Configuration for different file types */
  private readonly fileTypeConfigs: Map<FileType, FileTypeConfig> = new Map([
    [
      FileType.ink,
      {
        extensions: [".ink"],
        languageId: "ink",
        displayName: "Ink story",
      },
    ],
    [
      FileType.javaScript,
      {
        extensions: [".js", ".jsx", ".ts", ".tsx"],
        languageId: "javascript",
        displayName: "JavaScript file",
      },
    ],
  ]);

  // Public Methods ===================================================================================================

  /**
   * @inheritdoc
   */
  public async resolveFiles(
    fileType: FileType,
    uri?: vscode.Uri,
    uris?: vscode.Uri[]
  ): Promise<FileResolutionResult> {
    const candidateUris = this.getCandidateUris(uri, uris);

    if (candidateUris.length === 0) {
      return {
        validFiles: [],
        invalidFiles: [],
        hasSelection: false,
      };
    }

    const validFiles: vscode.Uri[] = [];
    const invalidFiles: { uri: vscode.Uri; reason: string }[] = [];

    for (const candidateUri of candidateUris) {
      if (await this.isValidFile(fileType, candidateUri)) {
        validFiles.push(candidateUri);
      } else {
        invalidFiles.push({
          uri: candidateUri,
          reason: this.getInvalidFileReason(fileType, candidateUri),
        });
      }
    }

    return {
      validFiles,
      invalidFiles,
      hasSelection: true,
    };
  }

  /**
   * @inheritdoc
   */
  public async isValidFile(
    fileType: FileType,
    uri: vscode.Uri
  ): Promise<boolean> {
    try {
      const config = this.getFileTypeConfig(fileType);

      // Check file extension
      const extension = path.extname(uri.fsPath).toLowerCase();
      if (!config.extensions.includes(extension)) {
        return false;
      }

      // For open documents, check language ID
      const openDoc = vscode.workspace.textDocuments.find(
        (doc) => doc.uri.toString() === uri.toString()
      );
      if (openDoc) {
        return openDoc.languageId === config.languageId;
      }

      // For files not open in editor, extension check is sufficient
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * @inheritdoc
   */
  public getResolutionContext(
    uri?: vscode.Uri,
    uris?: vscode.Uri[]
  ): FileResolutionContext {
    if (uris && uris.length > 0) {
      return FileResolutionContext.multiSelection;
    } else if (uri) {
      return FileResolutionContext.singleSelection;
    } else {
      return FileResolutionContext.activeEditor;
    }
  }

  /**
   * @inheritdoc
   */
  public formatResolutionMessages(
    fileType: FileType,
    result: FileResolutionResult
  ): {
    errorMessage?: string;
    warningMessage?: string;
  } {
    const config = this.getFileTypeConfig(fileType);
    const displayName = config.displayName;
    const displayNamePlural = `${displayName}s`;

    if (!result.hasSelection) {
      return {
        errorMessage: "No active document or selected file.",
      };
    }

    if (result.validFiles.length === 0) {
      // No valid files found
      if (result.invalidFiles.length === 1) {
        return {
          errorMessage: `Selected file is not ${this.getArticle(
            displayName
          )} ${displayName}: ${path.basename(
            result.invalidFiles[0].uri.fsPath
          )}`,
        };
      } else {
        const fileNames = result.invalidFiles
          .map((f) => path.basename(f.uri.fsPath))
          .join(", ");
        return {
          errorMessage: `${result.invalidFiles.length} selected files are not ${displayNamePlural}: ${fileNames}`,
        };
      }
    }

    if (result.invalidFiles.length > 0) {
      // Mixed valid and invalid files
      const invalidFileNames = result.invalidFiles
        .map((f) => path.basename(f.uri.fsPath))
        .join(", ");
      const message =
        result.invalidFiles.length === 1
          ? `Selected file is not ${this.getArticle(
              displayName
            )} ${displayName}: ${invalidFileNames}`
          : `${result.invalidFiles.length} selected files are not ${displayNamePlural}: ${invalidFileNames}`;

      return {
        warningMessage: `${message}. Processing ${
          result.validFiles.length
        } valid ${displayName}${result.validFiles.length === 1 ? "" : "s"}.`,
      };
    }

    // All files are valid - no messages needed
    return {};
  }

  // Private Methods ==================================================================================================

  /**
   * Get the configuration for a specific file type.
   * @param fileType The file type
   * @returns The configuration for the file type
   * @throws Error if the file type is not supported
   */
  private getFileTypeConfig(fileType: FileType): FileTypeConfig {
    const config = this.fileTypeConfigs.get(fileType);
    if (!config) {
      throw new Error(`Unsupported file type: ${fileType}`);
    }
    return config;
  }

  /**
   * Get the appropriate article (a/an) for a word.
   * @param word The word to get the article for
   * @returns "an" if the word starts with a vowel, "a" otherwise
   */
  private getArticle(word: string): string {
    const vowels = ["a", "e", "i", "o", "u"];
    return vowels.includes(word.toLowerCase().charAt(0)) ? "an" : "a";
  }

  /**
   * Get candidate URIs from the various input parameters.
   * @param uri Single URI parameter
   * @param uris Multiple URI parameter
   * @returns Array of candidate URIs to validate
   */
  private getCandidateUris(
    uri?: vscode.Uri,
    uris?: vscode.Uri[]
  ): vscode.Uri[] {
    // Priority 1: Use multiple URIs if provided (from multi-selection)
    if (uris && uris.length > 0) {
      return uris;
    }
    // Priority 2: Use single URI if provided (from context menu)
    else if (uri) {
      return [uri];
    }
    // Priority 3: Fall back to active text editor
    else {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        return [];
      }
      return [editor.document.uri];
    }
  }

  /**
   * Get a human-readable reason why a file is not valid for the specified type.
   * @param fileType The file type that was being validated
   * @param uri The invalid file URI
   * @returns Descriptive reason for invalidity
   */
  private getInvalidFileReason(fileType: FileType, uri: vscode.Uri): string {
    const config = this.getFileTypeConfig(fileType);
    const extension = path.extname(uri.fsPath).toLowerCase();

    if (!extension) {
      return "No file extension";
    } else if (!config.extensions.includes(extension)) {
      return `Invalid extension: ${extension}`;
    } else {
      return `Not recognized as ${config.languageId} language`;
    }
  }
}
