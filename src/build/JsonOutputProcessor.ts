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
import * as path from "path";
import { IPipelineProcessor } from "./IPipelineProcessor";
import { PipelineContext } from "./PipelineContext";
import { VSCodeServiceLocator } from "../services/VSCodeServiceLocator";
import { glob } from "../util/glob";
import { VSCodeConfigurationService } from "../services/VSCodeConfigurationService";
import { VSCodeDocumentService } from "../services/VSCodeDocumentService";

/**
 * A pipeline processor that writes the compiled story's JSON to a file.
 */
export class JsonOutputProcessor implements IPipelineProcessor {
  // Private Properties ===============================================================================================

  private configService: VSCodeConfigurationService;
  private documentService: VSCodeDocumentService;

  // Constructor ======================================================================================================

  constructor(
    configService?: VSCodeConfigurationService,
    documentService?: VSCodeDocumentService
  ) {
    this.configService =
      configService ?? VSCodeServiceLocator.getConfigurationService();
    this.documentService =
      documentService ?? VSCodeServiceLocator.getDocumentService();
  }

  // Private Methods ==================================================================================================

  private shouldEmitJson(context: PipelineContext): boolean {
    const enabled = this.configService.get<boolean>(
      "ink.compile.output.enableEmitStoryJSON",
      false,
      context.currentUri
    );

    if (!enabled) {
      return false;
    }

    const ignorePattern = this.configService.get<string>(
      "ink.compile.output.ignoreInkIncludes",
      "**/_*.ink",
      context.currentUri
    );

    if (ignorePattern && glob(context.currentUri, ignorePattern)) {
      return false;
    }

    return true;
  }

  private getOutputJsonUri(context: PipelineContext): vscode.Uri | undefined {
    const outputDirSetting = this.configService.get<string>(
      "ink.compile.output.directory",
      "out",
      context.currentUri
    );

    return this.documentService.resolveOutputUri(
      context.currentUri,
      outputDirSetting,
      "json"
    );
  }

  private reportError(context: PipelineContext, message: string): void {
    context.report(
      new vscode.Range(0, 0, 0, 1),
      message,
      vscode.DiagnosticSeverity.Error
    );
  }

  private async writeJsonFile(
    outputUri: vscode.Uri,
    jsonContent: string,
    context: PipelineContext
  ): Promise<void> {
    try {
      await this.documentService.writeTextFile(outputUri, jsonContent, true);
    } catch (e: any) {
      this.reportError(
        context,
        `Failed to save compiled story JSON to "${outputUri.fsPath}": ${e.message}`
      );
    }
  }

  // Public Methods ===================================================================================================

  public async run(context: PipelineContext): Promise<void> {
    // Resolve the compiled Story JSON and determine if
    // we should emit a file.
    const jsonContent = context.compiledStory?.ToJson();
    if (!jsonContent || !this.shouldEmitJson(context)) {
      return;
    }

    // Determine the output path for the compiled Story JSON.
    const outputUri = this.getOutputJsonUri(context);
    if (!outputUri) {
      this.reportError(
        context,
        `Could not determine output path for compiled story JSON`
      );
      return;
    }

    // Write the compiled Story JSON to the output path
    await this.writeJsonFile(outputUri, jsonContent, context);
  }
}
