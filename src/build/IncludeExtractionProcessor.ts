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
import { OutlineManager } from "../model/OutlineManager";
import { SymbolType } from "../model/OutlineEntity";
import {
  VSCodeDocumentService,
  VSCodeDocumentServiceImpl,
} from "../utils/VSCodeDocumentService";

/**
 * Pipeline processor for extracting includes from an Ink story.
 */
export class IncludeExtractionProcessor implements IPipelineProcessor {
  // Private Properties ===============================================================================================

  private docService: VSCodeDocumentService;

  constructor(
    docService: VSCodeDocumentService = new VSCodeDocumentServiceImpl()
  ) {
    this.docService = docService;
  }

  async run(context: PipelineContext): Promise<void> {
    const outlineManager = OutlineManager.getInstance();
    const visited = new Set<string>();
    const baseUri = context.currentUri;

    const loadIncludes = async (uri: vscode.Uri) => {
      if (visited.has(uri.toString())) {
        return;
      }
      visited.add(uri.toString());
      let doc: vscode.TextDocument;
      try {
        doc = await this.docService.getTextDocument(uri);
      } catch (err) {
        // If the root document can't be loaded, report and stop
        if (uri.toString() === baseUri.toString()) {
          context.report(
            new vscode.Range(0, 0, 0, 1),
            `Failed to open root document: ${uri.fsPath}`,
            vscode.DiagnosticSeverity.Error
          );
        }
        return;
      }
      // Get all include entities for this document
      const includes = outlineManager.queryByTypes(uri, SymbolType.include);
      for (const includeEntity of includes) {
        const includePath = includeEntity.name;
        const resolvedUri = this.docService.resolvePath(uri, includePath);
        if (!resolvedUri) {
          context.report(
            includeEntity.definitionRange,
            `Could not resolve include path: ${includePath}`,
            vscode.DiagnosticSeverity.Error
          );
          continue;
        }
        try {
          const includeDoc = await this.docService.getTextDocument(
            uri,
            includePath
          );
          context.includeDocuments.set(includePath, includeDoc);
          await loadIncludes(resolvedUri);
        } catch {
          context.report(
            includeEntity.definitionRange,
            `Included file not found: ${includePath}`,
            vscode.DiagnosticSeverity.Error
          );
        }
      }
    };

    await loadIncludes(baseUri);
  }
}
