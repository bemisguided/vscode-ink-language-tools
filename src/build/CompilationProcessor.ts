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
import { Compiler, CompilerOptions } from "inkjs/compiler/Compiler";
import { CompilationFileHandler } from "./compiler/CompilationFileHandler";
import { ErrorType as InkjsErrorType } from "inkjs/engine/Error";
import { parseCompilationError } from "./compiler/parseCompilationError";
import { VSCodeServiceLocator } from "../services/VSCodeServiceLocator";

/**
 * Pipeline processor that compiles an Ink file into a Story object.
 */
export class CompilationProcessor implements IPipelineProcessor {
  // Private Methods ==================================================================================================

  private getCountAllVisits(context: PipelineContext): boolean {
    const countAllVisits =
      VSCodeServiceLocator.getConfigurationService().get<boolean>(
        "ink.compile.behavior.countAllVisits",
        true,
        context.uri
      );
    return countAllVisits;
  }

  private async getCompilerOptions(
    context: PipelineContext
  ): Promise<CompilerOptions> {
    const text = await context.getText();
    return {
      sourceFilename: context.uri.fsPath,
      fileHandler: new CompilationFileHandler(context),
      pluginNames: [],
      countAllVisits: this.getCountAllVisits(context),
      errorHandler: (message: string, type: InkjsErrorType) => {
        const { message: msg, line } = parseCompilationError(message);
        const severity = this.toSeverity(type);
        const all = text.split(/\r?\n/);
        const lineText = all[line] || "";
        const range = new vscode.Range(
          new vscode.Position(line, 0),
          new vscode.Position(line, lineText.length)
        );
        context.reportDiagnostic(range, msg, severity);
      },
    };
  }

  private toSeverity(type: InkjsErrorType): vscode.DiagnosticSeverity {
    switch (type) {
      case InkjsErrorType.Author:
        return vscode.DiagnosticSeverity.Information;
      case InkjsErrorType.Warning:
        return vscode.DiagnosticSeverity.Warning;
      default: // Error
        return vscode.DiagnosticSeverity.Error;
    }
  }

  // Public Methods ===================================================================================================

  /**
   * @inheritdoc
   */
  async run(context: PipelineContext): Promise<void> {
    const text = await context.getText();
    try {
      const compilerOptions = await this.getCompilerOptions(context);
      const compiler = new Compiler(text, compilerOptions);
      context.story = compiler.Compile();
    } catch (err: any) {
      // No-op as the error will be handled by the error handler in CompilerOptions
    }
  }
}
