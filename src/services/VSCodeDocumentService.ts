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
import { IVSCodeConfigurationService } from "./VSCodeConfigurationService";
import { VSCodeServiceLocator } from "./VSCodeServiceLocator";

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
   * Resolve the source root URI for a context file.
   * @param contextUri The context file URI (main story file).
   * @returns The resolved source root URI.
   */
  resolveSourceRootUri(contextUri: vscode.Uri): vscode.Uri;

  /**
   * Resolve an output file URI based on an input file and new extension.
   * @param inputFile The input file URI.
   * @param newExtension The new extension for the output file.
   * @returns The resolved output file URI.
   */
  resolveOutputFileUri(inputFile: vscode.Uri, newExtension: string): vscode.Uri;

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
  // Private Properties ===============================================================================================

  private readonly configService: IVSCodeConfigurationService;

  // Constructor ======================================================================================================

  constructor(configService: IVSCodeConfigurationService) {
    this.configService = configService;
  }

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
    return await this.doOpenTextDocument(uri);
  }

  /**
   * @inheritdoc
   */
  public getWorkspaceFolder(uri: vscode.Uri): vscode.WorkspaceFolder {
    return this.doGetWorkspaceFolder(uri);
  }

  /**
   * @inheritdoc
   */
  public resolveSourceRootUri(contextUri: vscode.Uri): vscode.Uri {
    const sourceRoot = this.configService.get<string>(
      "ink.compile.behaviour.sourceRoot",
      "",
      contextUri
    );

    const workspaceFolder = this.getWorkspaceFolder(contextUri);

    // If sourceRoot is empty, return workspace root
    if (!sourceRoot || sourceRoot.trim() === "") {
      return workspaceFolder.uri;
    }

    // Validate sourceRoot path
    if (sourceRoot.startsWith("/") || sourceRoot.includes("..")) {
      console.warn(
        `[VSCodeDocumentService] Invalid sourceRoot path: ${sourceRoot}. Must be relative and not escape workspace.`
      );
      return workspaceFolder.uri;
    }

    // Resolve sourceRoot relative to workspace root
    const sourceRootUri = vscode.Uri.joinPath(
      workspaceFolder.uri,
      ...sourceRoot.split("/")
    );

    // Note: We don't validate if the directory exists here as it might be created later
    // The caller should handle non-existent directories as needed
    return sourceRootUri;
  }

  /**
   * @inheritdoc
   */
  public resolveOutputFileUri(
    inputFile: vscode.Uri,
    newExtension: string
  ): vscode.Uri {
    const outputDirectory = this.configService.get<string>(
      "ink.compile.output.directory",
      "out",
      inputFile
    );

    const workspaceFolder = this.getWorkspaceFolder(inputFile);
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
      await this.doCreateDirectory(vscode.Uri.file(path.dirname(uri.fsPath)));
    }
    await this.doWriteTextFile(uri, Buffer.from(content, "utf8"));
  }

  // Protected Methods ==============================================================================================

  /**
   * Create a directory.
   * @param uri The URI of the directory to create.
   */
  protected async doCreateDirectory(uri: vscode.Uri): Promise<void> {
    await vscode.workspace.fs.createDirectory(uri);
  }

  /**
   * Get the workspace folder for a URI.
   * @param uri The URI.
   * @returns The workspace folder, or the first workspace folder if the URI is not in a workspace.
   */
  protected doGetWorkspaceFolder(uri: vscode.Uri): vscode.WorkspaceFolder {
    return (
      vscode.workspace.getWorkspaceFolder(uri) ||
      vscode.workspace.workspaceFolders![0]
    );
  }

  /**
   * Open a text document.
   * @param uri The URI of the document to open.
   * @returns The opened text document.
   */
  protected async doOpenTextDocument(
    uri: vscode.Uri
  ): Promise<vscode.TextDocument> {
    return await vscode.workspace.openTextDocument(uri);
  }

  /**
   * Get file status.
   * @param uri The URI of the file to stat.
   * @returns The file stat.
   */
  protected async doFileStatus(uri: vscode.Uri): Promise<vscode.FileStat> {
    return await vscode.workspace.fs.stat(uri);
  }

  /**
   * Write a file.
   * @param uri The URI of the file to write.
   * @param content The content to write.
   */
  protected async doWriteTextFile(
    uri: vscode.Uri,
    content: Buffer
  ): Promise<void> {
    await vscode.workspace.fs.writeFile(uri, content);
  }
}
