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
 * Facade service to access VSCode Document API.
 */
export interface VSCodeDocumentService {
  /**
   * Dispose of the document service.
   */
  dispose(): void;

  /**
   * Check if a document exists at the resolved path.
   * @param baseUri The base URI.
   * @param path The path to check.
   * @returns True if the document exists, false otherwise.
   */
  exists(baseUri: vscode.Uri, path: string): Promise<boolean>;

  /**
   * Get the TextDocument at the resolved URI.
   * @param baseUri The base URI.
   * @param path The path to the document.
   * @returns The TextDocument.
   */
  getTextDocument(
    baseUri: vscode.Uri,
    path?: string
  ): Promise<vscode.TextDocument>;

  /**
   * Get the workspace folder for a URI.
   * @param uri The URI.
   * @returns The workspace folder, or undefined if the URI is not in a workspace.
   */
  getWorkspaceFolder(uri: vscode.Uri): vscode.WorkspaceFolder | undefined;

  /**
   * Write a text file to the workspace.
   * @param uri The URI of the file to write.
   * @param content The content to write to the file.
   * @param createDirectory Whether to create the directory if it doesn't exist.
   */
  writeTextFile(
    uri: vscode.Uri,
    content: string,
    createDirectory: boolean
  ): Promise<void>;

  /**
   * Resolve an output URI based on an input file, output directory, and new extension.
   * @param inputFile The input file URI.
   * @param outputDirectory The output directory.
   * @param newExtension The new extension for the output file.
   * @returns The resolved output URI, or undefined if the input file is not in a workspace.
   */
  resolveOutputUri(
    inputFile: vscode.Uri,
    outputDirectory: string,
    newExtension: string
  ): vscode.Uri | undefined;

  /**
   * Resolve a URI based on a base URI and a path.
   * @param baseUri The base URI.
   * @param path The path to resolve.
   * @returns The resolved URI.
   */
  resolvePath(baseUri: vscode.Uri, path: string): vscode.Uri | null;

  /**
   * Attempt to get the TextDocument at the resolved URI.
   * @param baseUri The base URI.
   * @param path The path to the document.
   * @returns The TextDocument, or undefined if the file does not exist or can't be opened.
   */
  tryGetTextDocument(
    baseUri: vscode.Uri,
    path?: string
  ): Promise<vscode.TextDocument | undefined>;
}

export class VSCodeDocumentServiceImpl implements VSCodeDocumentService {
  /**
   * Dispose of the document service.
   */
  public dispose(): void {
    // No-op
  }

  /**
   * Check if a document exists at the resolved path.
   */
  public async exists(baseUri: vscode.Uri, path: string): Promise<boolean> {
    const resolvedUri = this.resolvePath(baseUri, path);
    if (!resolvedUri) {
      return false;
    }

    try {
      await vscode.workspace.fs.stat(resolvedUri);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the TextDocument at the resolved URI.
   */
  public async getTextDocument(
    baseUri: vscode.Uri,
    path?: string
  ): Promise<vscode.TextDocument> {
    const doc = await this.tryGetTextDocument(baseUri, path);
    if (!doc) {
      throw new Error(`Failed to open document at "${baseUri.toString()}`);
    }
    return doc;
  }

  /**
   * Get the workspace folder for a URI.
   */
  public getWorkspaceFolder(
    uri: vscode.Uri
  ): vscode.WorkspaceFolder | undefined {
    return vscode.workspace.getWorkspaceFolder(uri);
  }

  /**
   * Write a text file to the workspace.
   */
  public async writeTextFile(
    uri: vscode.Uri,
    content: string,
    createDirectory = false
  ): Promise<void> {
    if (createDirectory) {
      await vscode.workspace.fs.createDirectory(
        vscode.Uri.file(path.dirname(uri.fsPath))
      );
    }
    await vscode.workspace.fs.writeFile(uri, Buffer.from(content, "utf8"));
  }

  /**
   * Resolve an output URI based on an input file, output directory, and new extension.
   */
  public resolveOutputUri(
    inputFile: vscode.Uri,
    outputDirectory: string,
    newExtension: string
  ): vscode.Uri | undefined {
    const workspaceFolder = this.getWorkspaceFolder(inputFile);
    if (!workspaceFolder) {
      return undefined;
    }

    const outputDir = path.join(workspaceFolder.uri.fsPath, outputDirectory);
    const inputFileName = path.basename(
      inputFile.fsPath,
      path.extname(inputFile.fsPath)
    );
    const outputFilePath = path.join(
      outputDir,
      `${inputFileName}.${newExtension}`
    );
    return vscode.Uri.file(outputFilePath);
  }

  /**
   * Resolve a URI based on a base URI and a path.
   * - If path starts with "/", it's treated as workspace-rooted.
   * - Otherwise, it's relative to baseUri.
   */
  public resolvePath(baseUri: vscode.Uri, path: string): vscode.Uri | null {
    if (path.startsWith("/")) {
      const workspaceFolder = vscode.workspace.getWorkspaceFolder(baseUri);
      if (!workspaceFolder) {
        return null;
      }
      return vscode.Uri.joinPath(
        workspaceFolder.uri,
        ...path.slice(1).split("/")
      );
    } else {
      return vscode.Uri.joinPath(baseUri, "..", ...path.split("/"));
    }
  }

  /**
   * Attempt to get the TextDocument at the resolved URI.
   */
  public async tryGetTextDocument(
    baseUri: vscode.Uri,
    path?: string
  ): Promise<vscode.TextDocument | undefined> {
    let resolvedUri: vscode.Uri;
    if (!path) {
      resolvedUri = baseUri;
    } else {
      const maybeUri = this.resolvePath(baseUri, path);
      if (!maybeUri) {
        return undefined;
      }
      resolvedUri = maybeUri;
    }
    try {
      return await vscode.workspace.openTextDocument(resolvedUri);
    } catch {
      return undefined;
    }
  }
}
