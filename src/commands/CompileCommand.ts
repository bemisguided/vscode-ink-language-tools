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
import { BuildEngine } from "../build/BuildEngine";
import * as path from "path";
import { VSCodeServiceLocator } from "../services/VSCodeServiceLocator";
import {
  IVSCodeFileContextService,
  FileType,
} from "../services/VSCodeFileContextService";

/**
 * Extension plugin for providing the Ink compile command.
 */
export class CompileCommand implements IExtensionPlugin {
  // Private Properties ===============================================================================================

  private readonly buildEngine: BuildEngine;
  private readonly fileContextService: IVSCodeFileContextService;

  // Constructor ======================================================================================================

  constructor() {
    this.buildEngine = BuildEngine.getInstance();
    this.fileContextService = VSCodeServiceLocator.getFileContextService();
  }

  // Public Methods ===================================================================================================

  /**
   * @inheritdoc
   */
  activate(context: vscode.ExtensionContext): void {
    const compileCommand = vscode.commands.registerCommand(
      "ink.compileFile",
      async (uri?: vscode.Uri, uris?: vscode.Uri[]) => {
        try {
          const result = await this.fileContextService.resolveFiles(
            FileType.ink,
            uri,
            uris
          );
          const messages = this.fileContextService.formatResolutionMessages(
            FileType.ink,
            result
          );

          // Handle error cases
          if (messages.errorMessage) {
            vscode.window.showErrorMessage(messages.errorMessage);
            return;
          }

          // Show warnings for mixed selections
          if (messages.warningMessage) {
            vscode.window.showWarningMessage(messages.warningMessage);
          }

          // Compile the valid files
          if (result.validFiles.length === 1) {
            await this.compileSingleFile(result.validFiles[0]);
          } else {
            await this.compileMultipleFiles(result.validFiles);
          }
        } catch (err: any) {
          vscode.window.showErrorMessage(
            `Failed to compile Ink file(s): ${err.message || err}`
          );
        }
      }
    );
    context.subscriptions.push(compileCommand);
  }

  /**
   * @inheritdoc
   */
  dispose(): void {
    // No explicit resources to dispose in this implementation
  }

  // Private Methods ==================================================================================================

  /**
   * Compile a single Ink file.
   * @param uri The URI of the file to compile
   */
  private async compileSingleFile(uri: vscode.Uri): Promise<void> {
    await this.compileInkFile(uri);
    vscode.window.showInformationMessage(
      `Ink file compiled successfully: ${path.basename(uri.fsPath)}`
    );
  }

  /**
   * Compile multiple Ink files with progress indication.
   * @param uris Array of URIs to compile
   */
  private async compileMultipleFiles(uris: vscode.Uri[]): Promise<void> {
    const results: { uri: vscode.Uri; success: boolean; error?: string }[] = [];

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Notification,
        title: `Compiling ${uris.length} Ink files`,
        cancellable: false,
      },
      async (progress) => {
        const increment = 100 / uris.length;

        for (let i = 0; i < uris.length; i++) {
          const uri = uris[i];
          const fileName = path.basename(uri.fsPath);

          progress.report({
            increment: i === 0 ? 0 : increment,
            message: `Compiling ${fileName}...`,
          });

          try {
            await this.compileInkFile(uri);
            results.push({ uri, success: true });
          } catch (error: any) {
            results.push({
              uri,
              success: false,
              error: error.message || error,
            });
          }
        }

        progress.report({ increment: increment, message: "Complete" });
      }
    );

    this.showCompilationSummary(results);
  }

  /**
   * Compile the specified Ink file.
   * @param uri The URI of the Ink file to compile
   */
  private async compileInkFile(uri: vscode.Uri): Promise<void> {
    // If the file is open in an editor, save it first
    const openDoc = vscode.workspace.textDocuments.find(
      (doc) => doc.uri.toString() === uri.toString()
    );
    if (openDoc && openDoc.isDirty) {
      await openDoc.save();
    }

    await this.buildEngine.compileStory(uri);
  }

  /**
   * Show a summary of compilation results for multiple files.
   * @param results Array of compilation results
   */
  private showCompilationSummary(
    results: { uri: vscode.Uri; success: boolean; error?: string }[]
  ): void {
    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    if (failed.length === 0) {
      // All successful
      vscode.window.showInformationMessage(
        `Successfully compiled ${successful.length} Ink file${
          successful.length === 1 ? "" : "s"
        }.`
      );
    } else if (successful.length === 0) {
      // All failed
      vscode.window.showErrorMessage(
        `Failed to compile ${failed.length} Ink file${
          failed.length === 1 ? "" : "s"
        }.`
      );
    } else {
      // Mixed results
      vscode.window.showWarningMessage(
        `Compiled ${successful.length} Ink file${
          successful.length === 1 ? "" : "s"
        } successfully, ${failed.length} failed.`
      );
    }

    // Log detailed errors to output channel for failed files
    if (failed.length > 0) {
      console.log(`Ink compilation errors:`);
      failed.forEach((result) => {
        console.log(`  ${path.basename(result.uri.fsPath)}: ${result.error}`);
      });
    }
  }
}
