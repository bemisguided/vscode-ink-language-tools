import { BaseProcessor } from "./BaseProcessor";
import {
  PipelineResult,
  CompilationErrorSeverity,
  BindableFunction,
} from "./types";
import * as path from "path";
import { PipelineContext } from "./PipelineContext";
import * as vscode from "vscode";
import { LineScanner } from "./LineScanner";
import { FileSystem } from "./FileSystem";

const MOCK_DIRECTIVE_REGEX = /^\s*\/\/\s*MOCKS\s+([^\s]+)\s*$/;

/**
 * Processor that handles mock function declarations in Ink files.
 * Extracts and binds external JavaScript functions for use in Ink stories.
 */
export class MockProcessor extends BaseProcessor {
  // Constructor ======================================================================================================

  constructor() {
    super("MockProcessor");
  }

  // Public Methods ===================================================================================================

  /**
   * Processes the content of an Ink file to find and extract mock function declarations.
   * @param context - The pipeline context containing the file content and metadata
   * @returns A pipeline result indicating success or failure
   */
  public async process(context: PipelineContext): Promise<PipelineResult> {
    this.logInfo(`⚙️ Processing: ${context.filePath}`);

    const scanner = new LineScanner(context.content, MOCK_DIRECTIVE_REGEX);
    await scanner.scan(async (match, line, column) => {
      await this.processMockDirective(match, line, column, context);
    });

    return this.createSuccessResult(context);
  }

  // Private Methods ===================================================================================================

  /**
   * Processes a single mock directive found in the Ink file.
   * @param match - The regex match containing the mock file path
   * @param line - The line number where the directive was found
   * @param column - The column number where the directive was found
   * @param context - The pipeline context for adding errors and functions
   */
  private async processMockDirective(
    match: RegExpMatchArray,
    line: number,
    column: number,
    context: PipelineContext
  ): Promise<void> {
    const mockPath = match[1];
    const fullPath = path.resolve(path.dirname(context.filePath), mockPath);

    try {
      // Check if file exists using FileSystem
      if (!(await FileSystem.fileExists(fullPath))) {
        throw new Error(`Mock file not found: ${mockPath}`);
      }

      // Clear the module from cache if it exists
      if (require.cache[fullPath]) {
        delete require.cache[fullPath];
      }

      // Dynamically import the mock file
      const mockModule = await import(fullPath);

      // Extract all exported functions
      const functions = this.extractBindableFunctions(mockModule);
      this.logInfo(
        `✅ Extracted "${functions.length}" External Function mock(s): ${mockPath}`
      );

      for (const func of functions) {
        this.logInfo(`   ➡️ External Function: ${func.name}`);
        context.addBindableFunction(func);
      }

      // Track the mock file for dependency management
      context.addDependency(fullPath);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logError(`🛑 External Function mocks: Failure: ${mockPath}`);
      context.addError({
        message: `Failed to read mock file '${mockPath}': ${errorMessage}`,
        file: context.filePath,
        line: line - 1,
        column: 0,
        severity: CompilationErrorSeverity.error,
      });
    }
  }

  /**
   * Extracts bindable functions from a JavaScript module.
   * @param module - The module to extract functions from
   * @returns An array of bindable functions found in the module
   */
  private extractBindableFunctions(module: any): BindableFunction[] {
    const functions: BindableFunction[] = [];
    // Get all properties of the module
    for (const [name, value] of Object.entries(module)) {
      // Check if the property is a function
      if (typeof value === "function") {
        functions.push({
          name,
          fn: value,
        });
      }
    }

    return functions;
  }
}
