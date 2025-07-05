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
 * Facade service to access VSCode Extension API and extension resources.
 */
export interface IVSCodeExtensionService {
  /**
   * Dispose of the extension service.
   */
  dispose(): void;

  /**
   * Get the extension URI.
   * @returns The extension URI.
   */
  getExtensionUri(): vscode.Uri;

  /**
   * Get the extension path.
   * @returns The extension path.
   */
  getExtensionPath(): string;

  /**
   * Get a webview URI for a resource path.
   * @param webview The webview to get the URI for.
   * @param resourcePath The resource path relative to the extension root.
   * @returns The webview URI.
   */
  getWebviewUri(webview: vscode.Webview, resourcePath: string): vscode.Uri;

  /**
   * Get a webview URI for a media file.
   * @param webview The webview to get the URI for.
   * @param fileName The media file name.
   * @returns The webview URI.
   */
  getWebviewMediaUri(webview: vscode.Webview, fileName: string): vscode.Uri;

  /**
   * Get the local resource roots for webviews.
   * @returns The local resource roots.
   */
  getWebviewLocalResourceRoots(): vscode.Uri[];

  /**
   * Get a URI for an icon file.
   * @param fileName The icon file name.
   * @returns The icon URI.
   */
  getIconUri(fileName: string): vscode.Uri;
}

/**
 * Implementation of the VSCodeExtensionService.
 */
export class VSCodeExtensionServiceImpl implements IVSCodeExtensionService {
  // Private Properties ===============================================================================================

  private static readonly extensionId = "bemisguided.vscode-ink-language-tools";
  private static readonly mediaPath = "media";
  private static readonly iconsPath = "icons";

  // Constructor ======================================================================================================

  constructor() {}

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
  public getExtensionUri(): vscode.Uri {
    const extension = vscode.extensions.getExtension(
      VSCodeExtensionServiceImpl.extensionId
    );
    if (!extension) {
      throw new Error(
        `Extension ${VSCodeExtensionServiceImpl.extensionId} not found`
      );
    }
    return extension.extensionUri;
  }

  /**
   * @inheritdoc
   */
  public getExtensionPath(): string {
    return this.getExtensionUri().fsPath;
  }

  /**
   * @inheritdoc
   */
  public getWebviewUri(
    webview: vscode.Webview,
    resourcePath: string
  ): vscode.Uri {
    const uri = vscode.Uri.file(
      path.join(this.getExtensionPath(), resourcePath)
    );
    return webview.asWebviewUri(uri);
  }

  /**
   * @inheritdoc
   */
  public getWebviewMediaUri(
    webview: vscode.Webview,
    fileName: string
  ): vscode.Uri {
    return this.getWebviewUri(
      webview,
      path.join(VSCodeExtensionServiceImpl.mediaPath, fileName)
    );
  }

  /**
   * @inheritdoc
   */
  public getWebviewLocalResourceRoots(): vscode.Uri[] {
    return [
      vscode.Uri.file(
        path.join(this.getExtensionPath(), VSCodeExtensionServiceImpl.mediaPath)
      ),
    ];
  }

  /**
   * @inheritdoc
   */
  public getIconUri(fileName: string): vscode.Uri {
    return vscode.Uri.file(
      path.join(
        this.getExtensionPath(),
        VSCodeExtensionServiceImpl.iconsPath,
        fileName
      )
    );
  }
}
