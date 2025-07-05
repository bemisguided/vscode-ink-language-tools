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
import { IVSCodeExtensionService } from "../../src/services/VSCodeExtensionService";
import { mockVSCodeUri } from "./mockVSCodeUri";

/**
 * Mock implementation of the VSCodeExtensionService for testing.
 */
export class MockVSCodeExtensionService implements IVSCodeExtensionService {
  // Private Properties ===============================================================================================

  private callLog: Array<{ method: string; args: any[] }> = [];

  // Constructor ======================================================================================================

  constructor() {}

  // Public Methods ===================================================================================================

  /**
   * @inheritdoc
   */
  public dispose(): void {
    this.logCall("dispose", []);
  }

  /**
   * @inheritdoc
   */
  public getExtensionUri(): vscode.Uri {
    this.logCall("getExtensionUri", []);
    return mockVSCodeUri("/mock/extension/path");
  }

  /**
   * @inheritdoc
   */
  public getExtensionPath(): string {
    this.logCall("getExtensionPath", []);
    return "/mock/extension/path";
  }

  /**
   * @inheritdoc
   */
  public getWebviewUri(
    webview: vscode.Webview,
    resourcePath: string
  ): vscode.Uri {
    this.logCall("getWebviewUri", [webview, resourcePath]);
    return mockVSCodeUri(`/mock/webview/uri/${resourcePath}`);
  }

  /**
   * @inheritdoc
   */
  public getWebviewMediaUri(
    webview: vscode.Webview,
    fileName: string
  ): vscode.Uri {
    this.logCall("getWebviewMediaUri", [webview, fileName]);
    return mockVSCodeUri(`/mock/webview/media/${fileName}`);
  }

  /**
   * @inheritdoc
   */
  public getWebviewLocalResourceRoots(): vscode.Uri[] {
    this.logCall("getWebviewLocalResourceRoots", []);
    return [mockVSCodeUri("/mock/extension/path/media")];
  }

  /**
   * @inheritdoc
   */
  public getIconUri(fileName: string): vscode.Uri {
    this.logCall("getIconUri", [fileName]);
    return mockVSCodeUri(`/mock/extension/path/icons/${fileName}`);
  }

  // Mock-specific Methods ============================================================================================

  /**
   * Get the call log for testing.
   * @returns The call log.
   */
  public getCallLog(): Array<{ method: string; args: any[] }> {
    return this.callLog;
  }

  /**
   * Clear the call log.
   */
  public clearCallLog(): void {
    this.callLog = [];
  }

  // Private Methods ==================================================================================================

  private logCall(method: string, args: any[]): void {
    this.callLog.push({ method, args });
  }
}
