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
import { mockVSCodeDocument } from "./mockVSCodeDocument";
import { VSCodeDocumentServiceImpl } from "../../src/services/VSCodeDocumentService";
import { mockVSCodeUri } from "./mockVSCodeUri";

export class MockVSCodeDocumentService extends VSCodeDocumentServiceImpl {
  // Private Properties ===============================================================================================

  private docs = new Map<string, vscode.TextDocument>();
  public writtenFiles = new Map<string, string>();

  // Private Methods ===================================================================================================

  private getKey(uri: vscode.Uri): string {
    const uriString = uri.toString().replace("file://", "");
    return uriString.replace(/\/\/+/g, "/");
  }

  // Public Methods ===================================================================================================

  /**
   * Add or override a mock document for a given URI.
   * @param uri The URI of the document.
   * @param content The content of the document.
   * @param version The version number of the document.
   * @returns The mocked text document.
   */
  public mockTextDocument(
    uri: vscode.Uri | string,
    content: string,
    version: number = 1
  ): vscode.TextDocument {
    const document = mockVSCodeDocument(uri, content, version);
    this.docs.set(this.getKey(document.uri), document);
    return document;
  }

  /**
   * Get the content of a mock written file for a given URI.
   * @param uri The URI of the file.
   * @param content The content of the file.
   */
  public mockGetWrittenFile(uri: vscode.Uri | string): string | undefined {
    const key = typeof uri === "string" ? uri : this.getKey(uri);
    if (!this.writtenFiles.has(key)) {
      throw new Error(
        `Mock written file not found for ${uri.toString()} (key=${key})`
      );
    }
    return this.writtenFiles.get(key);
  }

  // Protected Methods ==============================================================================================

  /**
   * @inheritdoc
   */
  protected override async createDirectory(uri: vscode.Uri): Promise<void> {
    // No-op for mock
  }

  /**
   * @inheritdoc
   */
  protected override getWorkspaceFolderOf(
    uri: vscode.Uri
  ): vscode.WorkspaceFolder | undefined {
    return {
      uri: mockVSCodeUri("/"),
      name: "mock-workspace",
      index: 0,
    };
  }

  /**
   * @inheritdoc
   */
  protected override async openTextDocument(
    uri: vscode.Uri
  ): Promise<vscode.TextDocument> {
    const key = this.getKey(uri);
    const doc = this.docs.get(key);
    if (!doc) {
      throw new Error(`Mock document not found for ${uri.toString()}`);
    }
    return doc;
  }

  /**
   * @inheritdoc
   */
  protected override async stat(uri: vscode.Uri): Promise<vscode.FileStat> {
    const key = this.getKey(uri);
    if (this.docs.has(key)) {
      return {
        type: vscode.FileType.File,
        ctime: 0,
        mtime: 0,
        size: 0,
      };
    }
    throw new Error(`File not found: ${uri.toString()}`);
  }

  /**
   * @inheritdoc
   */
  protected override async writeFile(
    uri: vscode.Uri,
    content: Buffer
  ): Promise<void> {
    const key = this.getKey(uri);
    this.writtenFiles.set(key, content.toString("utf8"));
  }
}
