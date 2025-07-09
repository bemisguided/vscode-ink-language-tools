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
import { IPipelineProcessor } from "./IPipelineProcessor";
import { PipelineContext } from "./PipelineContext";
import { VSCodeServiceLocator } from "../services/VSCodeServiceLocator";
import { glob } from "../util/glob";
import { IVSCodeConfigurationService } from "../services/VSCodeConfigurationService";
import { IVSCodeDocumentService } from "../services/VSCodeDocumentService";

/**
 * Abstract base class for output processors that write compiled story content to files.
 * Uses template method pattern to share common functionality while allowing customization.
 */
export abstract class BaseOutputPostProcessor implements IPipelineProcessor {
  // Private Properties ===============================================================================================

  private configService: IVSCodeConfigurationService;
  private documentService: IVSCodeDocumentService;

  // Constructor ======================================================================================================

  constructor(
    configService?: IVSCodeConfigurationService,
    documentService?: IVSCodeDocumentService
  ) {
    this.configService =
      configService ?? VSCodeServiceLocator.getConfigurationService();
    this.documentService =
      documentService ?? VSCodeServiceLocator.getDocumentService();
  }

  // Private Methods ==================================================================================================

  private shouldEmitOutput(context: PipelineContext): boolean {
    const enabled = this.configService.get<boolean>(
      this.getSettingName(),
      false,
      context.uri
    );

    if (!enabled) {
      return false;
    }

    const ignorePattern = this.configService.get<string>(
      "ink.compile.output.ignoreInkIncludes",
      "**/_*.ink",
      context.uri
    );

    if (ignorePattern && glob(context.uri, ignorePattern)) {
      return false;
    }

    return true;
  }

  private getOutputUri(context: PipelineContext): vscode.Uri | undefined {
    return this.documentService.resolveOutputFileUri(
      context.uri,
      this.getFileExtension()
    );
  }

  private reportError(context: PipelineContext, message: string): void {
    context.reportDiagnostic(
      context.uri,
      new vscode.Range(0, 0, 0, 1),
      message,
      vscode.DiagnosticSeverity.Error
    );
  }

  private async writeOutputFile(
    outputUri: vscode.Uri,
    content: string,
    context: PipelineContext
  ): Promise<void> {
    try {
      await this.documentService.writeTextFile(outputUri, content, true);
    } catch (e: any) {
      this.reportError(
        context,
        `Failed to save compiled story ${this.getErrorMessageType()} to "${
          outputUri.fsPath
        }": ${e.message}`
      );
    }
  }

  // Public Methods ===================================================================================================

  /**
   * @inheritdoc
   */
  public async run(context: PipelineContext): Promise<void> {
    // Resolve the compiled Story JSON and determine if
    // we should emit a file.
    const jsonContent = context.story?.ToJson();
    if (!jsonContent || !this.shouldEmitOutput(context)) {
      return;
    }

    // Determine the output path for the compiled story.
    const outputUri = this.getOutputUri(context);
    if (!outputUri) {
      this.reportError(
        context,
        `Could not determine output path for compiled story ${this.getErrorMessageType()}`
      );
      return;
    }

    // Transform the content and write to the output path
    const transformedContent = this.transformContent(jsonContent);
    await this.writeOutputFile(outputUri, transformedContent, context);
  }

  // Protected Methods =================================================================================================

  /**
   * Gets the configuration setting name for enabling this output type.
   * @returns The setting name (e.g., "ink.compile.output.enableEmitStoryJSON")
   */
  protected abstract getSettingName(): string;

  /**
   * Gets the file extension for this output type.
   * @returns The file extension (e.g., "json", "js")
   */
  protected abstract getFileExtension(): string;

  /**
   * Transforms the JSON content into the target output format.
   * @param jsonContent The raw JSON content from the compiled story
   * @returns The transformed content for the output file
   */
  protected abstract transformContent(jsonContent: string): string;

  /**
   * Gets the error message type for this output format.
   * @returns The type name used in error messages (e.g., "JSON", "JavaScript")
   */
  protected abstract getErrorMessageType(): string;
}
