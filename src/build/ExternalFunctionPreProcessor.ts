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
import { ExternalFunctionVM } from "./ExternalFunctionVM";
import { VSCodeServiceLocator } from "../services/VSCodeServiceLocator";

interface LinkDirective {
  path: string;
  line: number;
  character: number;
}

/**
 * Processes LINK directives to load external JavaScript functions into the VM.
 */
export class ExternalFunctionPreProcessor implements IPipelineProcessor {
  private static readonly singleLineRegex =
    /^\s*\/\/\s*LINKS?\s+(.+\.js)\s*$/gm;
  private static readonly multiLineCommentRegex = /\/\*[\s\S]*?\*\//gm;
  private static readonly linkInCommentRegex = /^\s*LINKS?\s+(.+\.js)\s*$/gm;

  public async run(context: PipelineContext): Promise<void> {
    console.debug(
      "[ExternalFunctionPreProcessor] Starting external function processing"
    );

    const linkDirectives = this.parseLinkDirectives(context.getText());

    if (linkDirectives.length === 0) {
      console.debug("[ExternalFunctionPreProcessor] No LINK directives found");
      return;
    }

    console.debug(
      `[ExternalFunctionPreProcessor] Found ${linkDirectives.length} LINK directives`
    );

    const externalFunctionVM = new ExternalFunctionVM();
    const documentService = VSCodeServiceLocator.getDocumentService();
    let hasAnyFailures = false;

    for (const directive of linkDirectives) {
      console.debug(
        `[ExternalFunctionPreProcessor] Processing directive: ${directive.path} at line ${directive.line}`
      );

      try {
        const resolvedUri = context.resolvePath(context.uri, directive.path);
        if (!resolvedUri) {
          throw new Error(`Could not resolve path: ${directive.path}`);
        }

        console.debug(
          `[ExternalFunctionPreProcessor] Resolved path: ${resolvedUri.fsPath}`
        );

        const jsDocument = await documentService.getTextDocument(resolvedUri);
        const jsContent = jsDocument.getText();
        const conflicts = externalFunctionVM.addJavaScriptContent(
          jsContent,
          directive.path
        );

        if (conflicts.length > 0) {
          hasAnyFailures = true;
          this.reportConflicts(
            context,
            directive,
            conflicts,
            externalFunctionVM
          );
        }
      } catch (error) {
        hasAnyFailures = true;
        console.error(
          `[ExternalFunctionPreProcessor] Error processing ${directive.path}:`,
          error
        );
        this.reportFileError(context, directive, error);
      }
    }

    if (externalFunctionVM.hasErrors()) {
      hasAnyFailures = true;
      this.reportVMErrors(context, externalFunctionVM);
    }

    if (!hasAnyFailures) {
      console.debug(
        `[ExternalFunctionPreProcessor] Successfully processed all LINK directives, storing VM`
      );
      context.setExternalFunctionVM(externalFunctionVM);
    } else {
      console.warn(
        "[ExternalFunctionPreProcessor] Disposing VM due to failures"
      );
      externalFunctionVM.dispose();
    }
  }

  private parseLinkDirectives(content: string): LinkDirective[] {
    const directives: LinkDirective[] = [];

    let match: RegExpExecArray | null;
    ExternalFunctionPreProcessor.singleLineRegex.lastIndex = 0;

    while (
      (match = ExternalFunctionPreProcessor.singleLineRegex.exec(content)) !==
      null
    ) {
      const filePath = match[1].trim();

      // Handle case where match includes leading newline
      const matchText = match[0];
      const actualDirectiveText = matchText.replace(/^\n/, "");
      const actualIndex = content.indexOf(actualDirectiveText, match.index);

      const lineNumber = this.getLineNumber(content, actualIndex);
      const character = this.getCharacterPosition(content, actualIndex);

      directives.push({
        path: filePath,
        line: lineNumber,
        character: character,
      });
    }

    ExternalFunctionPreProcessor.multiLineCommentRegex.lastIndex = 0;

    while (
      (match =
        ExternalFunctionPreProcessor.multiLineCommentRegex.exec(content)) !==
      null
    ) {
      const commentContent = match[0];
      const commentStartIndex = match.index;

      // Extract inner content without /* and */
      const innerContent = commentContent.slice(2, -2);

      ExternalFunctionPreProcessor.linkInCommentRegex.lastIndex = 0;
      let linkMatch: RegExpExecArray | null;

      while (
        (linkMatch =
          ExternalFunctionPreProcessor.linkInCommentRegex.exec(
            innerContent
          )) !== null
      ) {
        const filePath = linkMatch[1].trim();
        const absoluteIndex = commentStartIndex + 2 + linkMatch.index; // +2 for /*
        const lineNumber = this.getLineNumber(content, absoluteIndex);
        const character = this.getCharacterPosition(content, absoluteIndex);

        directives.push({
          path: filePath,
          line: lineNumber,
          character: character,
        });
      }
    }

    return directives;
  }

  private getLineNumber(content: string, index: number): number {
    return content.substring(0, index).split("\n").length - 1;
  }

  private getCharacterPosition(content: string, index: number): number {
    const textBeforeIndex = content.substring(0, index);
    const lastNewlineIndex = textBeforeIndex.lastIndexOf("\n");
    return lastNewlineIndex === -1 ? index : index - lastNewlineIndex - 1;
  }

  private reportFileError(
    context: PipelineContext,
    directive: LinkDirective,
    error: unknown
  ): void {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const message = `Error loading external function file '${directive.path}': ${errorMessage}`;

    context.reportDiagnostic(
      context.uri,
      new vscode.Range(
        directive.line,
        directive.character,
        directive.line,
        directive.character + directive.path.length + 5
      ),
      message,
      vscode.DiagnosticSeverity.Error
    );
  }

  private reportVMErrors(
    context: PipelineContext,
    vm: ExternalFunctionVM
  ): void {
    const errors = vm.getErrors();
    for (const error of errors) {
      context.reportDiagnostic(
        context.uri,
        new vscode.Range(0, 0, 0, 0),
        `External function VM error: ${error}`,
        vscode.DiagnosticSeverity.Error
      );
    }
  }

  private reportConflicts(
    context: PipelineContext,
    directive: LinkDirective,
    conflicts: string[],
    vm: ExternalFunctionVM
  ): void {
    for (const functionName of conflicts) {
      const existingSource = vm.getFunctionSource(functionName);
      const message = `Function '${functionName}' in '${directive.path}' conflicts with definition in '${existingSource}'`;

      context.reportDiagnostic(
        context.uri,
        new vscode.Range(
          directive.line,
          directive.character,
          directive.line,
          directive.character + directive.path.length + 5
        ),
        message,
        vscode.DiagnosticSeverity.Error
      );
    }
  }
}
