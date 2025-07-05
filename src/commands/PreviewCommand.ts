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
import { IExtensionPlugin } from "../IExtensionPlugin";
import { PreviewManager } from "../preview/PreviewManager";
import { VSCodeServiceLocator } from "../services/VSCodeServiceLocator";
import {
  IVSCodeFileContextService,
  FileType,
} from "../services/VSCodeFileContextService";

/**
 * Implements the VSCode Command for previewing an Ink story.
 */
export class PreviewCommand implements IExtensionPlugin {
  // Private Properties ===============================================================================================

  private previewManager: PreviewManager;
  private readonly fileContextService: IVSCodeFileContextService;

  // Constructors =====================================================================================================

  constructor() {
    this.previewManager = PreviewManager.getInstance();
    this.fileContextService = VSCodeServiceLocator.getFileContextService();
  }

  // Public Methods ===================================================================================================

  /**
   * @inheritdoc
   */
  activate(context: vscode.ExtensionContext): void {
    const previewCommand = vscode.commands.registerCommand(
      "ink.previewStory",
      async (uri?: vscode.Uri, uris?: vscode.Uri[]) => {
        try {
          const result = await this.fileContextService.resolveSingleFile(
            FileType.ink,
            uri,
            uris
          );

          // Handle no selection
          if (!result.hasSelection) {
            vscode.window.showErrorMessage(result.errorMessage!);
            return;
          }

          // Handle no valid file found
          if (!result.validFile) {
            vscode.window.showErrorMessage(result.errorMessage!);
            return;
          }

          // Show warning if multiple files were selected
          if (result.warningMessage) {
            vscode.window.showWarningMessage(result.warningMessage);
          }

          // Auto-save the file if it's dirty
          const openDoc = vscode.workspace.textDocuments.find(
            (doc) => doc.uri.toString() === result.validFile!.toString()
          );
          if (openDoc && openDoc.isDirty) {
            await openDoc.save();
          }

          // Preview the story
          const document =
            openDoc ||
            (await vscode.workspace.openTextDocument(result.validFile));
          await this.previewManager.preview(document);
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error occurred";
          vscode.window.showErrorMessage(`Preview failed: ${errorMessage}`);
        }
      }
    );
    context.subscriptions.push(previewCommand);
  }

  /**
   * @inheritdoc
   */
  dispose(): void {
    // No explicit resources to dispose in this implementation
  }
}
