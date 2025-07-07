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
 * Configuration options for the mock extension service.
 */
export interface MockVSCodeExtensionServiceConfig {
  /** Base extension path */
  extensionPath?: string;
  /** Media directory name */
  mediaDirectory?: string;
  /** Icons directory name */
  iconsDirectory?: string;
  /** URI scheme for webview URIs */
  webviewUriScheme?: string;
  /** Whether to throw errors on method calls */
  shouldThrowErrors?: boolean;
  /** Custom error messages for specific methods */
  errorMessages?: Partial<Record<keyof IVSCodeExtensionService, string>>;
}

/**
 * Enhanced mock implementation of the VSCodeExtensionService for testing.
 * Provides comprehensive mocking capabilities with configurable behavior.
 */
export class MockVSCodeExtensionService implements IVSCodeExtensionService {
  // Private Properties ===============================================================================================

  private callLog: Array<{
    method: string;
    args: any[];
    timestamp: number;
    result?: any;
  }> = [];

  private config: Required<MockVSCodeExtensionServiceConfig>;

  // Constructor ======================================================================================================

  /**
   * Creates a new mock extension service with optional configuration.
   * @param config Optional configuration for the mock behavior
   */
  constructor(config: MockVSCodeExtensionServiceConfig = {}) {
    this.config = {
      extensionPath: "/mock/extension/path",
      mediaDirectory: "media",
      iconsDirectory: "icons",
      webviewUriScheme: "vscode-webview",
      shouldThrowErrors: false,
      errorMessages: {},
      ...config,
    };
  }

  // Public Methods ===================================================================================================

  /**
   * @inheritdoc
   */
  public dispose(): void {
    this.executeWithLogging("dispose", [], () => {
      // Mock cleanup behavior
    });
  }

  /**
   * @inheritdoc
   */
  public getExtensionUri(): vscode.Uri {
    return this.executeWithLogging("getExtensionUri", [], () => {
      return mockVSCodeUri(this.config.extensionPath);
    });
  }

  /**
   * @inheritdoc
   */
  public getExtensionPath(): string {
    return this.executeWithLogging("getExtensionPath", [], () => {
      return this.config.extensionPath;
    });
  }

  /**
   * @inheritdoc
   */
  public getWebviewUri(
    webview: vscode.Webview,
    resourcePath: string
  ): vscode.Uri {
    return this.executeWithLogging(
      "getWebviewUri",
      [webview, resourcePath],
      () => {
        // Generate a realistic webview URI
        const normalizedPath = resourcePath.startsWith("/")
          ? resourcePath.substring(1)
          : resourcePath;
        return mockVSCodeUri(
          `${this.config.webviewUriScheme}://extension-id/` + normalizedPath
        );
      }
    );
  }

  /**
   * @inheritdoc
   */
  public getWebviewMediaUri(
    webview: vscode.Webview,
    fileName: string
  ): vscode.Uri {
    return this.executeWithLogging(
      "getWebviewMediaUri",
      [webview, fileName],
      () => {
        return mockVSCodeUri(
          `${this.config.webviewUriScheme}://extension-id/${this.config.mediaDirectory}/${fileName}`
        );
      }
    );
  }

  /**
   * @inheritdoc
   */
  public getWebviewLocalResourceRoots(): vscode.Uri[] {
    return this.executeWithLogging("getWebviewLocalResourceRoots", [], () => {
      return [
        mockVSCodeUri(
          `${this.config.extensionPath}/${this.config.mediaDirectory}`
        ),
        mockVSCodeUri(
          `${this.config.extensionPath}/${this.config.iconsDirectory}`
        ),
      ];
    });
  }

  /**
   * @inheritdoc
   */
  public getIconUri(fileName: string): vscode.Uri {
    return this.executeWithLogging("getIconUri", [fileName], () => {
      return mockVSCodeUri(
        `${this.config.extensionPath}/${this.config.iconsDirectory}/${fileName}`
      );
    });
  }

  // Mock-specific Methods ============================================================================================

  /**
   * Get the complete call log for testing verification.
   * @returns The complete call log with timestamps and results
   */
  public getCallLog(): Array<{
    method: string;
    args: any[];
    timestamp: number;
    result?: any;
  }> {
    return [...this.callLog];
  }

  /**
   * Get calls for a specific method.
   * @param method The method name to filter by
   * @returns Array of calls for the specified method
   */
  public getCallsForMethod(method: string): Array<{
    method: string;
    args: any[];
    timestamp: number;
    result?: any;
  }> {
    return this.callLog.filter((call) => call.method === method);
  }

  /**
   * Get the last call made to any method.
   * @returns The most recent call, or undefined if no calls were made
   */
  public getLastCall():
    | {
        method: string;
        args: any[];
        timestamp: number;
        result?: any;
      }
    | undefined {
    return this.callLog[this.callLog.length - 1];
  }

  /**
   * Get the last call made to a specific method.
   * @param method The method name to look for
   * @returns The most recent call to the method, or undefined if not found
   */
  public getLastCallForMethod(method: string):
    | {
        method: string;
        args: any[];
        timestamp: number;
        result?: any;
      }
    | undefined {
    const calls = this.getCallsForMethod(method);
    return calls[calls.length - 1];
  }

  /**
   * Clear the call log.
   */
  public clearCallLog(): void {
    this.callLog = [];
  }

  /**
   * Check if a method was called.
   * @param method The method name to check
   * @returns True if the method was called at least once
   */
  public wasMethodCalled(method: string): boolean {
    return this.callLog.some((call) => call.method === method);
  }

  /**
   * Check if a method was called with specific arguments.
   * @param method The method name to check
   * @param args The arguments to match (partial match)
   * @returns True if the method was called with matching arguments
   */
  public wasMethodCalledWith(method: string, ...args: any[]): boolean {
    return this.callLog.some((call) => {
      if (call.method !== method) {
        return false;
      }
      if (args.length === 0) {
        return true;
      }
      return args.every((arg, index) => {
        if (index >= call.args.length) {
          return false;
        }
        return JSON.stringify(call.args[index]) === JSON.stringify(arg);
      });
    });
  }

  /**
   * Get the number of times a method was called.
   * @param method The method name to count
   * @returns The number of times the method was called
   */
  public getMethodCallCount(method: string): number {
    return this.callLog.filter((call) => call.method === method).length;
  }

  /**
   * Update the mock configuration.
   * @param config New configuration to merge with existing config
   */
  public updateConfig(config: Partial<MockVSCodeExtensionServiceConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Reset the mock to its initial state.
   */
  public reset(): void {
    this.callLog = [];
  }

  // Static Factory Methods ===========================================================================================

  /**
   * Create a mock configured for basic testing scenarios.
   * @returns A new mock instance with standard configuration
   */
  public static createDefault(): MockVSCodeExtensionService {
    return new MockVSCodeExtensionService();
  }

  /**
   * Create a mock configured for webview testing.
   * @returns A new mock instance optimized for webview scenarios
   */
  public static createForWebviewTesting(): MockVSCodeExtensionService {
    return new MockVSCodeExtensionService({
      webviewUriScheme: "vscode-webview",
      mediaDirectory: "media",
      iconsDirectory: "icons",
    });
  }

  /**
   * Create a mock configured for error testing.
   * @param errorMessages Optional custom error messages for specific methods
   * @returns A new mock instance that throws errors
   */
  public static createForErrorTesting(
    errorMessages?: Partial<Record<keyof IVSCodeExtensionService, string>>
  ): MockVSCodeExtensionService {
    return new MockVSCodeExtensionService({
      shouldThrowErrors: true,
      errorMessages: errorMessages || {},
    });
  }

  /**
   * Create a mock with custom extension path.
   * @param extensionPath The custom extension path to use
   * @returns A new mock instance with the specified extension path
   */
  public static createWithExtensionPath(
    extensionPath: string
  ): MockVSCodeExtensionService {
    return new MockVSCodeExtensionService({ extensionPath });
  }

  // Private Methods ==================================================================================================

  /**
   * Execute a method with logging and error handling.
   * @param method The method name
   * @param args The method arguments
   * @param fn The function to execute
   * @returns The result of the function
   */
  private executeWithLogging<T>(method: string, args: any[], fn: () => T): T {
    const timestamp = Date.now();

    // Check if we should throw an error for this method
    if (this.config.shouldThrowErrors) {
      const errorMessage =
        this.config.errorMessages[method as keyof IVSCodeExtensionService] ||
        `Mock error in ${method}`;
      const error = new Error(errorMessage);
      this.callLog.push({ method, args, timestamp, result: error });
      throw error;
    }

    try {
      const result = fn();
      this.callLog.push({ method, args, timestamp, result });
      return result;
    } catch (error) {
      this.callLog.push({ method, args, timestamp, result: error });
      throw error;
    }
  }
}
