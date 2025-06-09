import * as path from "path";
import { CompilationErrorSeverity, CompilationError } from "../types";
import { PipelineResult } from "./BaseProcessor";
import { BaseProcessor } from "./BaseProcessor";
import { Compiler, CompilerOptions } from "inkjs/compiler/Compiler";
import { PipelineContext } from "./PipelineContext";
import { ErrorType as InkjsErrorType } from "inkjs/engine/Error";
import { InkFileHandler } from "./InkFileHandler";

/**
 * Processor that compiles the story
 */
export class CompileProcessor extends BaseProcessor {
  // Constructor ======================================================================================================

  constructor() {
    super("CompileProcessor");
  }

  // Public Methods ===================================================================================================

  public async process(context: PipelineContext): Promise<PipelineResult> {
    this.logInfo(`⚙️ Compiling story: ${context.filePath}`);

    try {
      // Get the includes hash from metadata
      const includes = context.metadata.get("includeMap") as
        | Map<string, string>
        | undefined;

      // Create compiler options with includes if available
      const compilerOptions = this.buildCompilerOptions(context);

      // Compile the story
      const compiler = new Compiler(context.content, compilerOptions);
      const result = compiler.Compile();

      if (result) {
        this.logInfo(`✅ Compiled story: ${context.filePath}`);
        context.metadata.set("story", result);
        context.metadata.set("jsonOutput", result.ToJson());
      }

      // Add any warnings from the compiler
      if (compiler.warnings) {
        for (const warning of compiler.warnings) {
          this.logInfo(`⚠️ Compilation warning: ${warning}`);
          const warningInfo = this.parseError(warning);
          context.addWarning({
            message: warningInfo.message,
            file: context.filePath,
            line: warningInfo.line,
            column: warningInfo.column,
            severity: warningInfo.severity,
          });
        }
      }

      // Return success if we got here
      return this.createSuccessResult(context);
    } catch (error) {
      this.logError(`🛑 Compilation failed: ${context.filePath}`);
      return this.createFailureResult(context);
    }
  }

  // Private Methods ===================================================================================================

  private buildFileHandler(context: PipelineContext): InkFileHandler {
    const includeMap = context.metadata.get("includeMap") as
      | Map<string, string>
      | undefined;

    if (!includeMap) {
      return new InkFileHandler(path.dirname(context.filePath), new Map());
    }
    return new InkFileHandler(path.dirname(context.filePath), includeMap);
  }

  private buildCompilerOptions(context: PipelineContext): CompilerOptions {
    const fileHandler = this.buildFileHandler(context);
    return {
      sourceFilename: context.filePath,
      fileHandler,
      pluginNames: [],
      countAllVisits: false,
      errorHandler: (message: string, type: InkjsErrorType) => {
        // Parse error message to extract line and column information
        const errorInfo = this.parseError(message);

        if (type === InkjsErrorType.Warning) {
          this.logInfo(`⚠️ ${errorInfo.message}`);
          context.addWarning({
            message: errorInfo.message,
            file: context.filePath,
            line: errorInfo.line,
            column: errorInfo.column,
            severity: errorInfo.severity,
          });
        } else {
          this.logError(`🛑 ${errorInfo.message}`);
          context.addError({
            message: errorInfo.message,
            file: context.filePath,
            line: errorInfo.line,
            column: errorInfo.column,
            severity: errorInfo.severity,
          });
        }
      },
    };
  }

  /**
   * Parse individual ink error/warning into structured format
   */
  private parseError(errorText: string): CompilationError {
    let line = 0;
    let column = 0;
    let message = errorText;

    // Parse line number from various patterns
    const lineMatch = errorText.match(/line (\d+)/i);
    if (lineMatch) {
      line = parseInt(lineMatch[1], 10) - 1; // Convert to 0-based
    }

    // Parse column number if present
    const columnMatch = errorText.match(/column (\d+)/i);
    if (columnMatch) {
      column = parseInt(columnMatch[1], 10) - 1; // Convert to 0-based
    }

    return {
      message,
      file: "", // Will be set by caller
      line,
      column,
      severity: CompilationErrorSeverity.error,
    };
  }
}
