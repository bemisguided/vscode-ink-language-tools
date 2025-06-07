import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";
import { Story } from "inkjs/engine/Story";
import { Compiler } from "inkjs/compiler/Compiler";

export interface CompilationResult {
  success: boolean;
  story?: Story;
  errors: CompilationError[];
  warnings: CompilationError[];
  includedFiles: string[];
}

export interface CompilationError {
  message: string;
  file: string;
  line: number;
  column: number;
  severity: vscode.DiagnosticSeverity;
  type: ErrorType;
  source?: string;
}

export enum ErrorType {
  SYNTAX_ERROR = "syntax",
  INCLUDE_ERROR = "include",
  RUNTIME_ERROR = "runtime",
  SEMANTIC_ERROR = "semantic",
  WARNING = "warning",
}

export class InkCompiler {
  private diagnosticCollection: vscode.DiagnosticCollection;
  private fileWatchers: Map<string, vscode.FileSystemWatcher> = new Map();
  private dependencyMap: Map<string, Set<string>> = new Map();

  constructor() {
    this.diagnosticCollection =
      vscode.languages.createDiagnosticCollection("ink");
  }

  /**
   * Compile an Ink file with full include support
   */
  public async compileFile(filePath: string): Promise<CompilationResult> {
    try {
      this.clearDiagnostics(filePath);

      const content = await this.readFile(filePath);
      if (!content) {
        return this.createErrorResult(filePath, "Could not read file", 0, 0);
      }

      console.log(`🔧 Compiling Ink file: ${path.basename(filePath)}`);

      return await this.performCompilation(filePath, content);
    } catch (error) {
      console.error("❌ Compilation failed:", error);
      return this.handleCompilationError(filePath, error);
    }
  }

  /**
   * Perform the actual compilation process
   */
  private async performCompilation(
    filePath: string,
    content: string
  ): Promise<CompilationResult> {
    // Validate inkjs library works with basic test
    await this.validateInkjsLibrary();

    // Process includes and get final content
    const { processedContent, includedFiles, includeErrors } =
      await this.processIncludes(content, filePath);

    if (includedFiles.length > 0) {
      console.log(
        `📦 Processed ${includedFiles.length} include(s):`,
        includedFiles.map((f) => path.basename(f))
      );
    }

    // If there are include errors, show them immediately
    if (includeErrors.length > 0) {
      console.log(`❌ Found ${includeErrors.length} include error(s)`);
      this.showDiagnostics(includeErrors, []);
      return {
        success: false,
        errors: includeErrors,
        warnings: [],
        includedFiles: [],
      };
    }

    // Create compiler and compile
    const compiler = new Compiler(processedContent);
    let compilationSucceeded = false;

    try {
      compiler.Compile();
      compilationSucceeded = true;
    } catch (compileErr: any) {
      // Let error processing handle this - don't throw immediately
    }

    // Process compilation results
    const compilationErrors = this.processCompilerErrors(
      compiler,
      filePath,
      content
    );
    const compilationWarnings = this.processCompilerWarnings(
      compiler,
      filePath,
      content
    );

    if (compilationErrors.length > 0) {
      console.log(`❌ Found ${compilationErrors.length} compilation error(s)`);
      this.showDiagnostics(compilationErrors, compilationWarnings);
      return {
        success: false,
        errors: compilationErrors,
        warnings: compilationWarnings,
        includedFiles: [],
      };
    }

    if (!compilationSucceeded) {
      throw new Error("Compilation failed without specific error information");
    }

    // Access compiled story
    const story = compiler.runtimeStory;
    if (!story) {
      throw new Error("Compilation produced no story");
    }

    console.log("✅ Compilation successful");

    // Update dependency tracking
    this.updateDependencies(filePath, includedFiles);
    this.setupFileWatching(filePath, includedFiles);

    // Show warnings if any
    if (compilationWarnings.length > 0) {
      this.showDiagnostics([], compilationWarnings);
    }

    return {
      success: true,
      story,
      errors: [],
      warnings: compilationWarnings,
      includedFiles,
    };
  }

  /**
   * Validate that the inkjs library is working correctly
   */
  private async validateInkjsLibrary(): Promise<void> {
    try {
      const testCompiler = new Compiler("Hello world!\n-> END");
      const testStory = testCompiler.Compile();
      if (!testStory) {
        throw new Error("inkjs library validation failed");
      }
    } catch (error: any) {
      throw new Error(`inkjs library not working: ${error?.message || error}`);
    }
  }

  /**
   * Read file content safely
   */
  private async readFile(filePath: string): Promise<string | null> {
    try {
      return fs.readFileSync(filePath, "utf8");
    } catch (error) {
      return null;
    }
  }

  /**
   * Process includes in Ink content and return processed content with list of included files
   */
  private async processIncludes(
    content: string,
    mainFilePath: string
  ): Promise<{
    processedContent: string;
    includedFiles: string[];
    includeErrors: CompilationError[];
  }> {
    const includedFiles: string[] = [];
    const includeErrors: CompilationError[] = [];
    let processedContent = content;
    const workspaceRoot = this.getWorkspaceRoot(mainFilePath);
    const fileDir = path.dirname(mainFilePath);
    const contentLines = content.split("\n");

    // Find all INCLUDE statements - match only the line containing INCLUDE
    const includePattern = /^[ \t]*INCLUDE\s+(.+?)[ \t]*$/gm;
    let match;
    const includes: {
      match: string;
      filePath: string;
      resolvedPath: string;
      lineNumber: number;
    }[] = [];

    while ((match = includePattern.exec(content)) !== null) {
      const includeFilePath = match[1].trim();
      const resolvedPath = this.resolveIncludePath(
        includeFilePath,
        fileDir,
        workspaceRoot
      );

      // Find the line number of this INCLUDE statement
      // Count newlines up to the match position for accurate line calculation
      const beforeMatch = content.substring(0, match.index);
      const newlineCount = (beforeMatch.match(/\n/g) || []).length;
      const lineNumber = newlineCount; // 0-based line number (should be accurate now)

      includes.push({
        match: match[0],
        filePath: includeFilePath,
        resolvedPath,
        lineNumber,
      });
    }

    // Process each include
    for (const include of includes) {
      try {
        const includeContent = await this.readFile(include.resolvedPath);
        if (includeContent) {
          // Replace the INCLUDE statement with the file content
          processedContent = processedContent.replace(
            include.match,
            includeContent
          );
          includedFiles.push(include.resolvedPath);
        } else {
          // Replace with error comment if file not found
          const errorMsg = `// ERROR: Include file not found: ${include.filePath}`;
          processedContent = processedContent.replace(include.match, errorMsg);

          // Create a proper CompilationError for the Problems panel
          includeErrors.push({
            message: `Include file not found: '${include.filePath}' (resolved to: ${include.resolvedPath})`,
            file: mainFilePath,
            line: include.lineNumber,
            column: 0,
            severity: vscode.DiagnosticSeverity.Error,
            type: ErrorType.INCLUDE_ERROR,
            source: contentLines[include.lineNumber]?.trim(),
          });

          console.log(
            `❌ Include error: File not found - ${include.resolvedPath}`
          );
        }
      } catch (error) {
        // Replace with error comment
        const errorMessage = `Failed to include ${include.filePath}: ${error}`;
        processedContent = processedContent.replace(
          include.match,
          `// ERROR: ${errorMessage}`
        );

        // Create a proper CompilationError for the Problems panel
        includeErrors.push({
          message: errorMessage,
          file: mainFilePath,
          line: include.lineNumber,
          column: 0,
          severity: vscode.DiagnosticSeverity.Error,
          type: ErrorType.INCLUDE_ERROR,
          source: contentLines[include.lineNumber]?.trim(),
        });
      }
    }

    return { processedContent, includedFiles, includeErrors };
  }

  /**
   * Resolve include path based on our rules:
   * - Starts with '/' = relative to workspace root
   * - Otherwise = relative to current file
   */
  private resolveIncludePath(
    includePath: string,
    fileDir: string,
    workspaceRoot: string
  ): string {
    if (includePath.startsWith("/")) {
      // Project root relative
      return path.join(workspaceRoot, includePath.substring(1));
    } else {
      // File relative
      return path.resolve(fileDir, includePath);
    }
  }

  /**
   * Get workspace root for a file
   */
  private getWorkspaceRoot(filePath: string): string {
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(
      vscode.Uri.file(filePath)
    );
    return workspaceFolder?.uri.fsPath || path.dirname(filePath);
  }

  /**
   * Process compiler errors into structured format
   */
  private processCompilerErrors(
    compiler: Compiler,
    filePath: string,
    content: string
  ): CompilationError[] {
    if (!compiler.errors || compiler.errors.length === 0) {
      return [];
    }

    const contentLines = content.split("\n");
    return compiler.errors.map((error) =>
      this.parseInkError(error, filePath, contentLines, false)
    );
  }

  /**
   * Process compiler warnings into structured format
   */
  private processCompilerWarnings(
    compiler: Compiler,
    filePath: string,
    content: string
  ): CompilationError[] {
    if (!compiler.warnings || compiler.warnings.length === 0) {
      return [];
    }

    const contentLines = content.split("\n");
    return compiler.warnings.map((warning) =>
      this.parseInkError(warning, filePath, contentLines, true)
    );
  }

  /**
   * Parse individual ink error/warning into structured format
   */
  private parseInkError(
    errorText: string,
    filePath: string,
    contentLines: string[],
    isWarning: boolean
  ): CompilationError {
    let line = 0;
    let column = 0;
    let message = errorText;
    let errorType = isWarning ? ErrorType.WARNING : ErrorType.SYNTAX_ERROR;

    // Parse line number from various patterns
    const linePatterns = [
      /line (\d+)/i, // "line 2"
      /at line (\d+)/i, // "at line 2"
      /on line (\d+)/i, // "on line 2"
      /\((\d+),\d+\)/, // "(2,5)" format
      /ERROR.*?line (\d+):/i, // "ERROR: line 2:" (inkjs format)
    ];

    for (const pattern of linePatterns) {
      const match = message.match(pattern);
      if (match) {
        line = Math.max(0, parseInt(match[1]) - 1);
        break;
      }
    }

    // Parse column number
    const columnPatterns = [/column (\d+)/i, /\(\d+,(\d+)\)/, /:(\d+):(\d+)/];

    for (const pattern of columnPatterns) {
      const match = message.match(pattern);
      if (match) {
        column = Math.max(0, parseInt(match[match.length - 1]) - 1);
        break;
      }
    }

    // Determine error type based on content
    const lowerMessage = message.toLowerCase();
    if (lowerMessage.includes("include")) {
      errorType = ErrorType.INCLUDE_ERROR;
    } else if (
      lowerMessage.includes("undefined") ||
      lowerMessage.includes("not found")
    ) {
      errorType = ErrorType.SEMANTIC_ERROR;
    } else if (lowerMessage.includes("runtime")) {
      errorType = ErrorType.RUNTIME_ERROR;
    }

    // Get source line context
    const source =
      line < contentLines.length ? contentLines[line]?.trim() : undefined;

    // Clean up error messages
    if (message.includes("Include file not found")) {
      message = `Include error: ${message}`;
    }

    return {
      message,
      file: filePath,
      line,
      column,
      severity: isWarning
        ? vscode.DiagnosticSeverity.Warning
        : vscode.DiagnosticSeverity.Error,
      type: errorType,
      source,
    };
  }

  /**
   * Handle compilation errors for unstructured errors
   */
  private handleCompilationError(
    filePath: string,
    error: any
  ): CompilationResult {
    const errorMessage =
      error?.message || error?.toString() || "Unknown compilation error";
    const contentLines: string[] = [];

    const parsedError = this.parseInkError(
      errorMessage,
      filePath,
      contentLines,
      false
    );

    this.showDiagnostics([parsedError], []);

    return {
      success: false,
      errors: [parsedError],
      warnings: [],
      includedFiles: [],
    };
  }

  /**
   * Create error result for simple cases
   */
  private createErrorResult(
    file: string,
    message: string,
    line: number,
    column: number
  ): CompilationResult {
    const error: CompilationError = {
      message,
      file,
      line,
      column,
      severity: vscode.DiagnosticSeverity.Error,
      type: ErrorType.SYNTAX_ERROR,
    };

    this.showDiagnostics([error], []);

    return {
      success: false,
      errors: [error],
      warnings: [],
      includedFiles: [],
    };
  }

  /**
   * Update dependency tracking for future include support
   */
  private updateDependencies(mainFile: string, includedFiles: string[]): void {
    this.dependencyMap.set(mainFile, new Set(includedFiles));

    for (const includedFile of includedFiles) {
      let dependents = this.dependencyMap.get(includedFile);
      if (!dependents) {
        dependents = new Set();
        this.dependencyMap.set(includedFile, dependents);
      }
      dependents.add(mainFile);
    }
  }

  /**
   * Set up file watchers for included files
   */
  private setupFileWatching(mainFile: string, includedFiles: string[]): void {
    for (const includedFile of includedFiles) {
      if (!this.fileWatchers.has(includedFile)) {
        const watcher = vscode.workspace.createFileSystemWatcher(includedFile);

        watcher.onDidChange(() => this.onIncludedFileChanged(includedFile));
        watcher.onDidDelete(() => this.onIncludedFileDeleted(includedFile));

        this.fileWatchers.set(includedFile, watcher);
      }
    }
  }

  /**
   * Handle changes to included files
   */
  private onIncludedFileChanged(changedFile: string): void {
    const dependents = this.getDependentFiles(changedFile);
    for (const dependent of dependents) {
      this.compileFile(dependent);
    }
  }

  /**
   * Handle deletion of included files
   */
  private onIncludedFileDeleted(deletedFile: string): void {
    this.onIncludedFileChanged(deletedFile);

    const watcher = this.fileWatchers.get(deletedFile);
    if (watcher) {
      watcher.dispose();
      this.fileWatchers.delete(deletedFile);
    }
  }

  /**
   * Get all files that depend on the given file
   */
  private getDependentFiles(file: string): string[] {
    const dependents: string[] = [];

    for (const [mainFile, dependencies] of this.dependencyMap) {
      if (dependencies.has(file)) {
        dependents.push(mainFile);
      }
    }

    return dependents;
  }

  /**
   * Show diagnostics in VSCode
   */
  private showDiagnostics(
    errors: CompilationError[],
    warnings: CompilationError[]
  ): void {
    const errorsByFile = new Map<string, CompilationError[]>();

    [...errors, ...warnings].forEach((error) => {
      if (!errorsByFile.has(error.file)) {
        errorsByFile.set(error.file, []);
      }
      errorsByFile.get(error.file)!.push(error);
    });

    for (const [file, fileErrors] of errorsByFile) {
      const diagnostics: vscode.Diagnostic[] = fileErrors.map((error) => {
        const range = new vscode.Range(
          new vscode.Position(error.line, error.column),
          new vscode.Position(error.line, error.column + 10)
        );
        return new vscode.Diagnostic(range, error.message, error.severity);
      });

      this.diagnosticCollection.set(vscode.Uri.file(file), diagnostics);
    }
  }

  /**
   * Clear diagnostics for a file
   */
  private clearDiagnostics(filePath: string): void {
    this.diagnosticCollection.set(vscode.Uri.file(filePath), []);
  }

  /**
   * Get recovery suggestions for compilation errors
   */
  private getRecoverySuggestions(errors: CompilationError[]): string[] {
    const suggestions: string[] = [];
    const errorTypes = new Set(errors.map((e) => e.type));

    if (errorTypes.has(ErrorType.INCLUDE_ERROR)) {
      suggestions.push(
        "Check that all included files exist and paths are correct"
      );
      suggestions.push("Use '/' prefix for project root relative paths");
    }

    if (errorTypes.has(ErrorType.SYNTAX_ERROR)) {
      suggestions.push(
        "Check for missing closing brackets, quotes, or other syntax elements"
      );
      suggestions.push("Verify that choice syntax uses * or + correctly");
    }

    if (errorTypes.has(ErrorType.SEMANTIC_ERROR)) {
      suggestions.push(
        "Check that all referenced knots, stitches, and variables are defined"
      );
      suggestions.push("Verify function names and parameter counts");
    }

    if (errorTypes.has(ErrorType.RUNTIME_ERROR)) {
      suggestions.push("Check for infinite loops or recursive calls");
      suggestions.push("Verify variable types and operations");
    }

    return suggestions;
  }

  /**
   * Enhanced error reporting with context and suggestions
   */
  public getCompilationReport(result: CompilationResult): string {
    if (result.success) {
      let report = "✓ Compilation successful";
      if (result.warnings.length > 0) {
        report += ` (${result.warnings.length} warnings)`;
      }
      return report;
    }

    let report = `✗ Compilation failed with ${result.errors.length} error(s)`;

    if (result.warnings.length > 0) {
      report += ` and ${result.warnings.length} warning(s)`;
    }

    // Add error details
    report += "\n\nErrors:";
    for (const error of result.errors) {
      report += `\n  ${error.type.toUpperCase()}: ${error.message}`;
      if (error.source) {
        report += `\n    at line ${error.line + 1}: ${error.source}`;
      }
    }

    // Add recovery suggestions
    const suggestions = this.getRecoverySuggestions(result.errors);
    if (suggestions.length > 0) {
      report += "\n\nSuggestions:";
      for (const suggestion of suggestions) {
        report += `\n  • ${suggestion}`;
      }
    }

    return report;
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    this.diagnosticCollection.dispose();

    for (const watcher of this.fileWatchers.values()) {
      watcher.dispose();
    }
    this.fileWatchers.clear();
  }
}
