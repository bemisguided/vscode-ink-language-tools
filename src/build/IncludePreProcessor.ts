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
import { EntityType } from "../model/OutlineEntity";
import { VSCodeServiceLocator } from "../services/VSCodeServiceLocator";
import { IVSCodeDocumentService } from "../services/VSCodeDocumentService";
import { OutlineManager } from "../model/OutlineManager";

/**
 * Pipeline processor for pre-processing includes of an Ink story.
 */
export class IncludePreProcessor implements IPipelineProcessor {
  // Private Properties ===============================================================================================

  private readonly docService: IVSCodeDocumentService;

  private readonly outlineManager: OutlineManager;

  // Constructor ======================================================================================================

  constructor(docService?: IVSCodeDocumentService) {
    this.docService = docService ?? VSCodeServiceLocator.getDocumentService();
    this.outlineManager = OutlineManager.getInstance();
  }

  // Private Methods ===================================================================================================

  private async addInclude(
    context: PipelineContext,
    currentUri: vscode.Uri,
    includePath: string,
    processTodo: vscode.Uri[]
  ): Promise<void> {
    const resolvedUri = context.resolvePath(
      context.uri,
      includePath,
      currentUri
    );
    if (!resolvedUri) {
      // no-op, as we let the Ink compiler handle the missing file reporting
      return;
    }

    try {
      const includeDoc = await this.docService.getTextDocument(resolvedUri);
      context.includeDocuments.set(includePath, includeDoc);
      context.addDependency(currentUri, resolvedUri);
    } catch (e) {
      // no-op, as we let the Ink compiler handle the missing file reporting
    }

    processTodo.push(resolvedUri);
  }

  // Public Methods ===================================================================================================

  async run(context: PipelineContext): Promise<void> {
    // Reset collections
    context.includeDocuments.clear();

    // Use a queue for traversal and a set to track processed files
    const processTodo: vscode.Uri[] = [context.uri];
    const processComplete = new Set<string>();

    while (processTodo.length > 0) {
      const currentUri = processTodo.shift()!;
      const uriString = currentUri.toString();

      if (processComplete.has(uriString)) {
        continue;
      }
      processComplete.add(uriString);

      const includeEntities = this.outlineManager.queryByTypes(
        currentUri,
        EntityType.include
      );

      for (const includeEntity of includeEntities) {
        const includePath = includeEntity.name;
        await this.addInclude(context, currentUri, includePath, processTodo);
      }
    }
  }
}
