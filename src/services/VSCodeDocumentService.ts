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
export interface IVSCodeDocumentService {
  /**
   * Dispose of the document service.
   */
  dispose(): void;

  /**
   * Get the TextDocument at the resolved URI.
   * @param uri The URI of the document.
   * @returns The TextDocument.
   */
  getTextDocument(uri: vscode.Uri): Promise<vscode.TextDocument>;

  /**
   * Get the workspace folder for a URI.
   * @param uri The URI.
   * @returns The workspace folder, or undefined if the URI is not in a workspace.
   */
  getWorkspaceFolder(uri: vscode.Uri): vscode.WorkspaceFolder | undefined;

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
}

/**
 * Implementation of the VSCodeDocumentService.
 */
export class VSCodeDocumentServiceImpl implements IVSCodeDocumentService {
  // Public Methods ===================================================================================================

  /**
   * @inheritdoc
   */
  public dispose(): void {
    // No-op
  }

  /**
   * @inheritdoc
   */
  public async getTextDocument(uri: vscode.Uri): Promise<vscode.TextDocument> {
    return await this.openTextDocument(uri);
  }

  /**
   * @inheritdoc
   */
  public getWorkspaceFolder(
    uri: vscode.Uri
  ): vscode.WorkspaceFolder | undefined {
    return this.getWorkspaceFolderOf(uri);
  }

  /**
   * @inheritdoc
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
   * @inheritdoc
   */
  public async writeTextFile(
    uri: vscode.Uri,
    content: string,
    createDirectory = false
  ): Promise<void> {
    if (createDirectory) {
      await this.createDirectory(vscode.Uri.file(path.dirname(uri.fsPath)));
    }
    await this.writeFile(uri, Buffer.from(content, "utf8"));
  }

  // Protected Methods ==============================================================================================

  /**
   * Create a directory.
   * @param uri The URI of the directory to create.
   */
  protected async createDirectory(uri: vscode.Uri): Promise<void> {
    await vscode.workspace.fs.createDirectory(uri);
  }

  /**
   * Get the workspace folder for a URI.
   * @param uri The URI.
   * @returns The workspace folder, or undefined if the URI is not in a workspace.
   */
  protected getWorkspaceFolderOf(
    uri: vscode.Uri
  ): vscode.WorkspaceFolder | undefined {
    return vscode.workspace.getWorkspaceFolder(uri);
  }

  /**
   * Open a text document.
   * @param uri The URI of the document to open.
   * @returns The opened text document.
   */
  protected async openTextDocument(
    uri: vscode.Uri
  ): Promise<vscode.TextDocument> {
    return await vscode.workspace.openTextDocument(uri);
  }

  /**
   * Get file status.
   * @param uri The URI of the file to stat.
   * @returns The file stat.
   */
  protected async stat(uri: vscode.Uri): Promise<vscode.FileStat> {
    return await vscode.workspace.fs.stat(uri);
  }

  /**
   * Write a file.
   * @param uri The URI of the file to write.
   * @param content The content to write.
   */
  protected async writeFile(uri: vscode.Uri, content: Buffer): Promise<void> {
    await vscode.workspace.fs.writeFile(uri, content);
  }
}
