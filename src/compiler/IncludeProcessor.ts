import * as path from "path";
import { BaseProcessor, PipelineResult } from "./BaseProcessor";
import { CompilationErrorSeverity } from "../types";
import { PipelineContext } from "./PipelineContext";
import { LineScanner } from "./LineScanner";
import { FileSystem } from "./FileSystem";

const INCLUDE_DIRECTIVE_REGEX = /^\s*INCLUDE\s+([^\s]+)\s*$/;

/**
 * Processor that handles include directives
 */
export class IncludeProcessor extends BaseProcessor {
  // Constructor ======================================================================================================

  constructor() {
    super("IncludeProcessor");
  }

  // Public Methods ===================================================================================================

  public async process(context: PipelineContext): Promise<PipelineResult> {
    this.logInfo(`⚙️ Processing: ${context.filePath}`);

    // Initialize the include map in metadata
    const includesMap: Map<string, string> = new Map<string, string>();
    context.metadata.set("includeMap", includesMap);

    let hasErrors = false;

    try {
      const scanner = new LineScanner(context.content, INCLUDE_DIRECTIVE_REGEX);
      await scanner.scan(async (match, line, column) => {
        const result = await this.processIncludeDirective(
          match,
          line,
          column,
          context,
          includesMap
        );
        if (!result) {
          hasErrors = true;
        }
      });

      if (hasErrors) {
        return this.createFailureResult(context);
      }

      return this.createSuccessResult(context);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logError(`🛑 Include: Failure: ${errorMessage}`);
      context.addError({
        message: `Failed to process includes: ${errorMessage}`,
        file: context.filePath,
        line: 0,
        column: 0,
        severity: CompilationErrorSeverity.error,
      });
      return this.createFailureResult(context);
    }
  }

  // Private Methods ===================================================================================================

  private async processIncludeDirective(
    match: RegExpMatchArray,
    line: number,
    column: number,
    context: PipelineContext,
    includes: Map<string, string>
  ): Promise<boolean> {
    const includePath = match[1];
    const fullFilename = path.resolve(
      path.dirname(context.filePath),
      includePath
    );

    try {
      const fileContent = await FileSystem.readFile(fullFilename);
      this.logInfo(`✅ Include: Success: ${includePath}`);

      // Add to includes hash - use the original include path as the key
      includes.set(fullFilename, fileContent);

      // Track the included file for dependency management
      context.addDependency(fullFilename);

      return true;
    } catch (error: unknown) {
      this.logError(`🛑 Include: Failure: ${includePath}`);
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      context.addError({
        message: `Failed to process INCLUDE file: '${includePath}': ${errorMessage}`,
        file: context.filePath,
        line: line - 1,
        column: 0,
        severity: CompilationErrorSeverity.error,
      });
      return false;
    }
  }
}
