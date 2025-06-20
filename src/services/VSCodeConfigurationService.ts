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

/**
 * Facade service to access VSCode Configuration API.
 */
export interface VSCodeConfigurationService {
  /**
   * Retrieves a configuration setting using its full key.
   * @param key The full configuration key, e.g., 'myExtension.someSetting'.
   * @param defaultValue The default value to return if the setting is not found.
   * @param scope Optional Uri or TextDocument used to resolve workspace folder settings.
   * @returns The effective value at the given scope.
   */
  get<T>(
    key: string,
    defaultValue: T,
    scope?: vscode.Uri | vscode.TextDocument
  ): T;
}

/**
 * Implementation of the VSCodeConfigurationService.
 */
export class VSCodeConfigurationServiceImpl
  implements VSCodeConfigurationService
{
  // Private Methods ===================================================================================================

  private getFolderUri(uri: vscode.Uri): vscode.Uri | undefined {
    const folder = vscode.workspace.getWorkspaceFolder(uri);
    return folder?.uri;
  }

  private resolveFolderUri(
    scope?: vscode.Uri | vscode.TextDocument
  ): vscode.Uri | undefined {
    if (!scope) {
      return undefined;
    }
    if (scope instanceof vscode.Uri) {
      return this.getFolderUri(scope);
    }
    return this.getFolderUri(scope.uri);
  }

  // Public Methods ===================================================================================================

  public get<T>(
    key: string,
    defaultValue: T,
    scope?: vscode.Uri | vscode.TextDocument
  ): T {
    const folderUri = this.resolveFolderUri(scope);
    const configValue = vscode.workspace
      .getConfiguration(undefined, folderUri)
      .get<T>(key);
    return configValue ?? defaultValue;
  }
}
