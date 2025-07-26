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

import * as vm from "vm";
import { Story } from "inkjs/engine/Story";

/**
 * Manages a JavaScript VM sandbox for external function mocks.
 * Handles loading, executing, and binding mock functions to Ink stories.
 */
export class ExternalFunctionVM {
  // Private Properties ===============================================================================================

  private sandbox: any;
  private readonly functions: Map<string, Function>;
  private readonly functionSources: Map<string, string>; // functionName -> filePath
  private readonly errors: string[];
  private readonly loadedContent: Array<{ content: string; filePath: string }>;
  private isDisposed: boolean = false;

  // Static Configuration =============================================================================================

  private static readonly vmConfig = {
    timeout: 5000, // 5 seconds
    allowedGlobals: [
      "Math",
      "Date",
      "JSON",
      "parseInt",
      "parseFloat",
      "isNaN",
      "isFinite",
    ],
  };

  // Constructor ======================================================================================================

  constructor() {
    this.sandbox = this.createSandbox();
    this.functions = new Map();
    this.functionSources = new Map();
    this.errors = [];
    this.loadedContent = [];
  }

  // Public Methods ===================================================================================================

  /**
   * Adds JavaScript content to the VM and extracts functions.
   * @param content - JavaScript content to add
   * @param filePath - File path for error reporting and conflict detection
   * @returns Array of function names that had conflicts (empty if no conflicts)
   */
  public addJavaScriptContent(content: string, filePath: string): string[] {
    this.ensureNotDisposed();
    const conflicts: string[] = [];

    try {
      // Create a temporary sandbox to execute this content
      const tempSandbox = this.createSandbox();

      // Execute the content in the temporary sandbox
      vm.createContext(tempSandbox);
      vm.runInContext(content, tempSandbox, {
        filename: filePath,
        timeout: ExternalFunctionVM.vmConfig.timeout,
      });

      // Extract functions from the temporary sandbox
      const extractedFunctions = this.extractFunctions(tempSandbox);

      // Check for conflicts with existing functions
      for (const [functionName, fn] of extractedFunctions) {
        if (this.functions.has(functionName)) {
          conflicts.push(functionName);
        } else {
          // Add to main sandbox and function map
          this.functions.set(functionName, fn);
          this.functionSources.set(functionName, filePath);
        }
      }

      // If no conflicts, record the content as loaded
      if (conflicts.length === 0) {
        this.loadedContent.push({ content, filePath });

        // Merge the temp sandbox into the main sandbox
        this.mergeSandboxes(tempSandbox);
      } else {
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown execution error";
      this.errors.push(`Error loading ${filePath}: ${errorMessage}`);
    }

    return conflicts;
  }

  /**
   * Gets the names of all available functions.
   * @returns Array of function names
   */
  public getFunctionNames(): string[] {
    this.ensureNotDisposed();
    return Array.from(this.functions.keys());
  }

  /**
   * Checks if a function with the given name exists.
   * @param name - Function name to check
   * @returns True if function exists
   */
  public hasFunction(name: string): boolean {
    this.ensureNotDisposed();
    return this.functions.has(name);
  }

  /**
   * Gets the source file path for a function.
   * @param functionName - Function name
   * @returns File path or undefined if function not found
   */
  public getFunctionSource(functionName: string): string | undefined {
    this.ensureNotDisposed();
    return this.functionSources.get(functionName);
  }

  /**
   * Binds a specific function to an Ink Story.
   * @param story - The Ink Story to bind the function to
   * @param functionName - Name of the function to bind
   * @param onFunctionCall - Optional callback for function call tracking
   * @returns True if function was bound successfully, false if function not found
   */
  public bindFunction(
    story: Story,
    functionName: string,
    onFunctionCall?: (functionName: string, args: any[], result: any) => void
  ): boolean {
    this.ensureNotDisposed();

    const fn = this.functions.get(functionName);
    if (!fn) {
      return false;
    }

    try {
      story.BindExternalFunction(
        functionName,
        (...args: any[]) => {
          try {
            const result = fn.apply(this.sandbox, args);
            onFunctionCall?.(functionName, args, result);
            return result;
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : "Unknown function error";
            throw new Error(
              `Mock function '${functionName}' failed: ${errorMessage}`
            );
          }
        },
        false
      );
      return true;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown binding error";
      this.errors.push(
        `Failed to bind function '${functionName}': ${errorMessage}`
      );
      return false;
    }
  }

  /**
   * Binds multiple functions to an Ink Story.
   * @param story - The Ink Story to bind functions to
   * @param functionNames - Array of function names to bind
   * @param onFunctionCall - Optional callback for function call tracking
   * @returns Array of function names that failed to bind
   */
  public bindFunctions(
    story: Story,
    functionNames: string[],
    onFunctionCall?: (functionName: string, args: any[], result: any) => void
  ): string[] {
    const failedBindings: string[] = [];

    for (const functionName of functionNames) {
      if (!this.bindFunction(story, functionName, onFunctionCall)) {
        failedBindings.push(functionName);
      }
    }

    return failedBindings;
  }

  /**
   * Gets all errors that occurred during VM operations.
   * @returns Array of error messages
   */
  public getErrors(): string[] {
    return [...this.errors];
  }

  /**
   * Checks if this VM has any errors.
   * @returns True if there are errors
   */
  public hasErrors(): boolean {
    return this.errors.length > 0;
  }

  /**
   * Gets information about loaded content.
   * @returns Array of loaded content info
   */
  public getLoadedContent(): Array<{ content: string; filePath: string }> {
    return [...this.loadedContent];
  }

  /**
   * Disposes of this VM and cleans up resources.
   */
  public dispose(): void {
    if (this.isDisposed) {
      return;
    }

    this.functions.clear();
    this.functionSources.clear();
    this.errors.length = 0;
    this.loadedContent.length = 0;

    // Clear sandbox reference
    this.sandbox = null;

    this.isDisposed = true;
  }

  // Private Methods ==================================================================================================

  /**
   * Creates a sandbox environment with allowed globals.
   * @returns Sandbox object
   */
  private createSandbox(): any {
    const sandbox: Record<string, any> = {
      exports: {},
      module: { exports: {} },
      console: {
        log: (...args: any[]) => {
          console.log(...args);
        },
        warn: (...args: any[]) => {
          console.warn(...args);
        },
        error: (...args: any[]) => {
          console.error(...args);
        },
      },
    };

    // Add allowed globals
    for (const globalName of ExternalFunctionVM.vmConfig.allowedGlobals) {
      if (globalName in global) {
        sandbox[globalName] = (global as any)[globalName];
      }
    }

    return sandbox;
  }

  /**
   * Extracts CommonJS exports from a sandbox.
   * @param sandbox - Executed VM sandbox
   * @returns Map of function names to functions
   */
  private extractFunctions(sandbox: any): Map<string, Function> {
    const functions = new Map<string, Function>();

    // Check module.exports first (takes precedence)
    const moduleExports = sandbox.module?.exports;
    if (moduleExports && typeof moduleExports === "object") {
      for (const [name, value] of Object.entries(moduleExports)) {
        if (typeof value === "function") {
          functions.set(name, value as Function);
        }
      }
    }

    // Then check exports object (if module.exports is empty)
    if (functions.size === 0) {
      const exports = sandbox.exports;
      if (exports && typeof exports === "object") {
        for (const [name, value] of Object.entries(exports)) {
          if (typeof value === "function") {
            functions.set(name, value as Function);
          }
        }
      }
    }

    return functions;
  }

  /**
   * Merges a temporary sandbox into the main sandbox.
   * @param tempSandbox - Temporary sandbox to merge
   */
  private mergeSandboxes(tempSandbox: any): void {
    // Merge exports
    if (tempSandbox.exports) {
      Object.assign(this.sandbox.exports, tempSandbox.exports);
    }

    // Merge module.exports
    if (tempSandbox.module?.exports) {
      Object.assign(this.sandbox.module.exports, tempSandbox.module.exports);
    }
  }

  /**
   * Ensures the VM is not disposed.
   * @throws Error if VM is disposed
   */
  private ensureNotDisposed(): void {
    if (this.isDisposed) {
      throw new Error("ExternalFunctionVM has been disposed");
    }
  }
}
