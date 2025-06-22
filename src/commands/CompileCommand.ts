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

/**
 * Implements the VSCode command for compiling an Ink story.
 */
export class CompileCommand implements IExtensionPlugin {
  // Private Properties ===============================================================================================

  private buildEngine: BuildEngine;

  // Constructor ======================================================================================================

  constructor() {
    this.buildEngine = BuildEngine.getInstance();
  }

  // Public Methods ===================================================================================================

  /**
   * @inheritdoc
   */
  activate(context: vscode.ExtensionContext): void {
    const compileCommand = vscode.commands.registerCommand(
      "ink.compileFile",
      async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
          vscode.window.showErrorMessage("No active document.");
          return;
        }
        const document = editor.document;
        if (document.languageId !== "ink") {
          vscode.window.showErrorMessage(
            "Active document is not an Ink story."
          );
          return;
        }
        await document.save();
        try {
          await this.buildEngine.compileStory(document.uri);
          vscode.window.showInformationMessage(
            "Ink file compiled successfully."
          );
        } catch (err: any) {
          vscode.window.showErrorMessage(
            `Failed to compile Ink file: ${err.message || err}`
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
}
