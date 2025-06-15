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

const EXTENSION_ID = "bemisguided.vscode-ink-language-tools";

const MEDIA_PATH = "media";

export class ExtensionUtils {
  // Public Static Methods ============================================================================================

  // Extension Information
  public static getExtensionUri(): vscode.Uri {
    const extension = vscode.extensions.getExtension(EXTENSION_ID);
    if (!extension) {
      throw new Error(`Extension ${EXTENSION_ID} not found`);
    }
    return extension.extensionUri;
  }

  public static getExtensionPath(): string {
    return this.getExtensionUri().fsPath;
  }

  // Webview URIs
  public static getWebviewURL(
    webview: vscode.Webview,
    resourcePath: string
  ): vscode.Uri {
    const uri = vscode.Uri.file(
      path.join(this.getExtensionPath(), resourcePath)
    );
    return webview.asWebviewUri(uri);
  }

  public static getWebviewMediaURL(
    webview: vscode.Webview,
    fileName: string
  ): vscode.Uri {
    return this.getWebviewURL(webview, path.join(MEDIA_PATH, fileName));
  }

  public static getWebviewLocalResourceRoots(): vscode.Uri[] {
    return [vscode.Uri.file(path.join(this.getExtensionPath(), MEDIA_PATH))];
  }
}
