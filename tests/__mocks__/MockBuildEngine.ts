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
import { IBuildResult } from "../../src/build/IBuildResult";
import { createMockSuccessfulBuildResult, createMockFailedBuildResult } from "./mockBuildResult";

/**
 * Mock implementation of BuildEngine for testing.
 */
export class MockBuildEngine {
  // Private Properties ===============================================================================================
  
  private compilationResults: Map<string, IBuildResult> = new Map();
  private compilationDelay: number = 0;
  private compileStoryCallLog: Array<{ uri: vscode.Uri; timestamp: number }> = [];
  private shouldFailCompilation: boolean = false;
  private failureMessage: string = "Mock compilation failed";
  
  // Public Methods ===================================================================================================
  
  /**
   * Mock implementation of compileStory.
   * @param uri - The URI of the story to compile
   * @returns Promise resolving to build result
   */
  public async compileStory(uri: vscode.Uri): Promise<IBuildResult> {
    // Log the call
    this.compileStoryCallLog.push({
      uri,
      timestamp: Date.now(),
    });
    
    // Add artificial delay if configured
    if (this.compilationDelay > 0) {
      await new Promise(resolve => setTimeout(resolve, this.compilationDelay));
    }
    
    // Check if we should fail compilation
    if (this.shouldFailCompilation) {
      return createMockFailedBuildResult(uri.fsPath, this.failureMessage);
    }
    
    // Check if we have a predefined result for this URI
    const key = uri.toString();
    if (this.compilationResults.has(key)) {
      return this.compilationResults.get(key)!;
    }
    
    // Return default successful result
    return createMockSuccessfulBuildResult(uri.fsPath);
  }
  
  // Test Configuration Methods =======================================================================================
  
  /**
   * Sets the compilation result for a specific URI.
   * @param uri - The URI to set result for
   * @param result - The build result to return
   */
  public setCompilationResult(uri: vscode.Uri, result: IBuildResult): void {
    this.compilationResults.set(uri.toString(), result);
  }
  
  /**
   * Sets the compilation delay for testing async behavior.
   * @param delay - Delay in milliseconds
   */
  public setCompilationDelay(delay: number): void {
    this.compilationDelay = delay;
  }
  
  /**
   * Configures the mock to fail compilation.
   * @param shouldFail - Whether compilation should fail
   * @param message - Optional failure message
   */
  public setShouldFailCompilation(shouldFail: boolean, message?: string): void {
    this.shouldFailCompilation = shouldFail;
    if (message) {
      this.failureMessage = message;
    }
  }
  
  /**
   * Clears all predefined compilation results.
   */
  public clearCompilationResults(): void {
    this.compilationResults.clear();
  }
  
  /**
   * Resets the mock to its initial state.
   */
  public reset(): void {
    this.compilationResults.clear();
    this.compileStoryCallLog = [];
    this.compilationDelay = 0;
    this.shouldFailCompilation = false;
    this.failureMessage = "Mock compilation failed";
  }
  
  // Test Inspection Methods ==========================================================================================
  
  /**
   * Gets the call log for compileStory.
   * @returns Array of compilation calls
   */
  public getCompileStoryCallLog(): Array<{ uri: vscode.Uri; timestamp: number }> {
    return [...this.compileStoryCallLog];
  }
  
  /**
   * Gets the number of times compileStory was called.
   * @returns Number of calls
   */
  public getCompileStoryCallCount(): number {
    return this.compileStoryCallLog.length;
  }
  
  /**
   * Gets the last URI that was compiled.
   * @returns The last compiled URI or undefined
   */
  public getLastCompiledUri(): vscode.Uri | undefined {
    const lastCall = this.compileStoryCallLog[this.compileStoryCallLog.length - 1];
    return lastCall?.uri;
  }
  
  /**
   * Checks if a specific URI was compiled.
   * @param uri - The URI to check
   * @returns True if the URI was compiled
   */
  public wasUriCompiled(uri: vscode.Uri): boolean {
    return this.compileStoryCallLog.some(call => call.uri.toString() === uri.toString());
  }
  
  /**
   * Clears the call log.
   */
  public clearCallLog(): void {
    this.compileStoryCallLog = [];
  }
} 