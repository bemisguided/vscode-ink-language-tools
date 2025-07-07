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
import { MockWebview } from "./MockWebview";

/**
 * Mock implementation of vscode.WebviewPanel for testing.
 */
export class MockWebviewPanel {
  // Public Properties ================================================================================================

  public readonly webview: MockWebview;
  public title: string = "";
  public iconPath?: vscode.Uri;
  public readonly viewType: string;
  public readonly onDidDispose: vscode.Event<void>;
  public readonly onDidChangeViewState: vscode.Event<vscode.WebviewPanelOnDidChangeViewStateEvent>;
  public readonly options: vscode.WebviewPanelOptions;
  public readonly viewColumn?: vscode.ViewColumn;
  public active: boolean = true;
  public visible: boolean = true;

  // Private Properties ===============================================================================================

  private disposables: vscode.Disposable[] = [];
  private onDidDisposeEmitter: vscode.EventEmitter<void>;
  private onDidChangeViewStateEmitter: vscode.EventEmitter<vscode.WebviewPanelOnDidChangeViewStateEvent>;
  private isDisposed: boolean = false;

  // Constructor ======================================================================================================

  constructor(
    viewType: string = "mockWebview",
    title: string = "Mock Webview",
    showOptions:
      | vscode.ViewColumn
      | { viewColumn: vscode.ViewColumn; preserveFocus?: boolean } = vscode
      .ViewColumn.One,
    options: vscode.WebviewPanelOptions & vscode.WebviewOptions = {}
  ) {
    this.viewType = viewType;
    this.title = title;
    this.options = options;
    this.webview = new MockWebview();

    // Set up view column
    if (typeof showOptions === "object" && "viewColumn" in showOptions) {
      this.viewColumn = showOptions.viewColumn;
    } else {
      this.viewColumn = showOptions;
    }

    // Set up event emitters
    this.onDidDisposeEmitter = new vscode.EventEmitter<void>();
    this.onDidDispose = this.onDidDisposeEmitter.event;

    this.onDidChangeViewStateEmitter =
      new vscode.EventEmitter<vscode.WebviewPanelOnDidChangeViewStateEvent>();
    this.onDidChangeViewState = this.onDidChangeViewStateEmitter.event;
  }

  // Public Methods ===================================================================================================

  /**
   * Mock implementation of reveal.
   * @param viewColumn - The view column to reveal in
   * @param preserveFocus - Whether to preserve focus
   */
  public reveal(viewColumn?: vscode.ViewColumn, preserveFocus?: boolean): void {
    if (this.isDisposed) {
      throw new Error("Cannot reveal disposed webview panel");
    }

    this.active = true;
    this.visible = true;

    // Fire view state change event
    this.onDidChangeViewStateEmitter.fire({
      webviewPanel: this as any,
    });
  }

  /**
   * Mock implementation of dispose.
   */
  public dispose(): void {
    if (this.isDisposed) {
      return;
    }

    this.isDisposed = true;
    this.active = false;
    this.visible = false;

    this.webview.dispose();
    this.disposables.forEach((d) => d.dispose());
    this.disposables = [];

    this.onDidDisposeEmitter.fire();
    this.onDidDisposeEmitter.dispose();
    this.onDidChangeViewStateEmitter.dispose();
  }

  // Test Helper Methods ==============================================================================================

  /**
   * Simulates the webview panel becoming inactive.
   */
  public simulateInactive(): void {
    this.active = false;
    this.onDidChangeViewStateEmitter.fire({
      webviewPanel: this as any,
    });
  }

  /**
   * Simulates the webview panel becoming active.
   */
  public simulateActive(): void {
    this.active = true;
    this.onDidChangeViewStateEmitter.fire({
      webviewPanel: this as any,
    });
  }

  /**
   * Simulates the webview panel becoming invisible.
   */
  public simulateInvisible(): void {
    this.visible = false;
    this.onDidChangeViewStateEmitter.fire({
      webviewPanel: this as any,
    });
  }

  /**
   * Simulates the webview panel becoming visible.
   */
  public simulateVisible(): void {
    this.visible = true;
    this.onDidChangeViewStateEmitter.fire({
      webviewPanel: this as any,
    });
  }

  /**
   * Checks if the panel is disposed.
   * @returns True if disposed
   */
  public isDisposedState(): boolean {
    return this.isDisposed;
  }

  /**
   * Gets the current state of the panel.
   * @returns Panel state object
   */
  public getState(): {
    active: boolean;
    visible: boolean;
    disposed: boolean;
    title: string;
    viewType: string;
  } {
    return {
      active: this.active,
      visible: this.visible,
      disposed: this.isDisposed,
      title: this.title,
      viewType: this.viewType,
    };
  }
}
