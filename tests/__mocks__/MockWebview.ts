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
import { mockVSCodeUri } from "./mockVSCodeUri";

/**
 * Mock implementation of vscode.Webview for testing.
 */
export class MockWebview {
  // Public Properties ================================================================================================

  public html: string = "";
  public options: vscode.WebviewOptions = {};
  public onDidReceiveMessage: vscode.Event<any>;

  // Private Properties ===============================================================================================

  private messageHandlers: ((message: any) => void)[] = [];
  private disposables: vscode.Disposable[] = [];
  private sentMessages: any[] = [];

  // Constructor ======================================================================================================

  constructor() {
    this.onDidReceiveMessage = (listener: (message: any) => void) => {
      this.messageHandlers.push(listener);
      const disposable = {
        dispose: () => {
          const index = this.messageHandlers.indexOf(listener);
          if (index > -1) {
            this.messageHandlers.splice(index, 1);
          }
        },
      };
      this.disposables.push(disposable);
      return disposable;
    };
  }

  // Public Methods ===================================================================================================

  /**
   * Mock implementation of postMessage.
   * @param message - The message to post
   * @returns Promise that resolves to true
   */
  public postMessage(message: any): Thenable<boolean> {
    this.sentMessages.push(message);
    return Promise.resolve(true);
  }

  /**
   * Mock implementation of asWebviewUri.
   * @param localResource - The local resource URI
   * @returns Mock webview URI
   */
  public asWebviewUri(localResource: vscode.Uri): vscode.Uri {
    return mockVSCodeUri(`webview://mock/${localResource.path}`);
  }

  /**
   * Mock implementation of acquireVsCodeApi.
   * @returns Mock VS Code API object
   */
  public acquireVsCodeApi(): any {
    return {
      postMessage: (message: any) => this.postMessage(message),
      setState: jest.fn(),
      getState: jest.fn(),
    };
  }

  // Test Helper Methods ==============================================================================================

  /**
   * Simulates receiving a message from the webview.
   * @param message - The message to simulate
   */
  public simulateMessage(message: any): void {
    this.messageHandlers.forEach((handler) => handler(message));
  }

  /**
   * Gets all messages sent to the webview.
   * @returns Array of sent messages
   */
  public getSentMessages(): any[] {
    return [...this.sentMessages];
  }

  /**
   * Gets the last message sent to the webview.
   * @returns The last sent message or undefined
   */
  public getLastSentMessage(): any {
    return this.sentMessages[this.sentMessages.length - 1];
  }

  /**
   * Clears all sent messages.
   */
  public clearSentMessages(): void {
    this.sentMessages = [];
  }

  /**
   * Gets the number of message handlers registered.
   * @returns Number of handlers
   */
  public getHandlerCount(): number {
    return this.messageHandlers.length;
  }

  /**
   * Disposes all handlers.
   */
  public dispose(): void {
    this.disposables.forEach((d) => d.dispose());
    this.disposables = [];
    this.messageHandlers = [];
    this.sentMessages = [];
  }
}
