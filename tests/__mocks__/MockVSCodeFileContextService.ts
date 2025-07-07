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
  IVSCodeFileContextService,
  FileType,
  FileResolutionResult,
  SingleFileResolutionResult,
  FileResolutionContext,
} from "../../src/services/VSCodeFileContextService";

/**
 * Mock implementation of the VSCodeFileContextService for testing.
 */
export class MockVSCodeFileContextService implements IVSCodeFileContextService {
  // Public Properties ================================================================================================

  public resolveFilesCalls: Array<{
    fileType: FileType;
    uri?: vscode.Uri;
    uris?: vscode.Uri[];
  }> = [];

  public resolveSingleFileCalls: Array<{
    fileType: FileType;
    uri?: vscode.Uri;
    uris?: vscode.Uri[];
  }> = [];

  public isValidFileCalls: Array<{
    fileType: FileType;
    uri: vscode.Uri;
  }> = [];

  public formatResolutionMessagesCalls: Array<{
    fileType: FileType;
    result: FileResolutionResult;
  }> = [];

  // Mock Return Values
  public resolveFilesReturnValue: FileResolutionResult = {
    validFiles: [],
    invalidFiles: [],
    hasSelection: false,
  };

  public resolveSingleFileReturnValue: SingleFileResolutionResult = {
    hasSelection: false,
  };

  public isValidFileReturnValue: boolean = true;

  public formatResolutionMessagesReturnValue: {
    errorMessage?: string;
    warningMessage?: string;
  } = {};

  // Public Methods ===================================================================================================

  /**
   * @inheritdoc
   */
  public async resolveFiles(
    fileType: FileType,
    uri?: vscode.Uri,
    uris?: vscode.Uri[]
  ): Promise<FileResolutionResult> {
    this.resolveFilesCalls.push({ fileType, uri, uris });
    return this.resolveFilesReturnValue;
  }

  /**
   * @inheritdoc
   */
  public async resolveSingleFile(
    fileType: FileType,
    uri?: vscode.Uri,
    uris?: vscode.Uri[]
  ): Promise<SingleFileResolutionResult> {
    this.resolveSingleFileCalls.push({ fileType, uri, uris });
    return this.resolveSingleFileReturnValue;
  }

  /**
   * @inheritdoc
   */
  public async isValidFile(
    fileType: FileType,
    uri: vscode.Uri
  ): Promise<boolean> {
    this.isValidFileCalls.push({ fileType, uri });
    return this.isValidFileReturnValue;
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
    this.formatResolutionMessagesCalls.push({ fileType, result });
    return this.formatResolutionMessagesReturnValue;
  }

  // Test Helper Methods ==============================================================================================

  /**
   * Reset all call tracking and return values.
   */
  public reset(): void {
    this.resolveFilesCalls = [];
    this.resolveSingleFileCalls = [];
    this.isValidFileCalls = [];
    this.formatResolutionMessagesCalls = [];
    this.resolveFilesReturnValue = {
      validFiles: [],
      invalidFiles: [],
      hasSelection: false,
    };
    this.resolveSingleFileReturnValue = {
      hasSelection: false,
    };
    this.isValidFileReturnValue = true;
    this.formatResolutionMessagesReturnValue = {};
  }

  /**
   * Set up mock to return specific files as valid.
   * @param validFiles The URIs to return as valid files
   */
  public setValidFiles(validFiles: vscode.Uri[]): void {
    this.resolveFilesReturnValue = {
      validFiles,
      invalidFiles: [],
      hasSelection: true,
    };
  }

  /**
   * Set up mock to return specific files as invalid.
   * @param invalidFiles The URIs to return as invalid files
   */
  public setInvalidFiles(
    invalidFiles: { uri: vscode.Uri; reason: string }[]
  ): void {
    this.resolveFilesReturnValue = {
      validFiles: [],
      invalidFiles,
      hasSelection: true,
    };
  }

  /**
   * Set up mock to return mixed valid and invalid files.
   * @param validFiles The URIs to return as valid files
   * @param invalidFiles The URIs to return as invalid files
   */
  public setMixedFiles(
    validFiles: vscode.Uri[],
    invalidFiles: { uri: vscode.Uri; reason: string }[]
  ): void {
    this.resolveFilesReturnValue = {
      validFiles,
      invalidFiles,
      hasSelection: true,
    };
  }

  /**
   * Set up mock to return no selection.
   */
  public setNoSelection(): void {
    this.resolveFilesReturnValue = {
      validFiles: [],
      invalidFiles: [],
      hasSelection: false,
    };
    this.resolveSingleFileReturnValue = {
      hasSelection: false,
      errorMessage: "No active document or selected file.",
    };
  }

  /**
   * Set up mock to return a single valid file.
   * @param validFile The URI to return as the valid file
   */
  public setSingleValidFile(validFile: vscode.Uri): void {
    this.resolveSingleFileReturnValue = {
      validFile,
      hasSelection: true,
    };
  }

  /**
   * Set up mock to return an error for single file resolution.
   * @param errorMessage The error message to return
   */
  public setSingleFileError(errorMessage: string): void {
    this.resolveSingleFileReturnValue = {
      hasSelection: true,
      errorMessage,
    };
  }

  /**
   * Set up mock to return a warning for single file resolution.
   * @param validFile The valid file to return
   * @param warningMessage The warning message to include
   */
  public setSingleFileWarning(
    validFile: vscode.Uri,
    warningMessage: string
  ): void {
    this.resolveSingleFileReturnValue = {
      validFile,
      hasSelection: true,
      warningMessage,
    };
  }
}
