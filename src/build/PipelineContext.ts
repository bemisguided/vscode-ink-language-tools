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
import { DependencyNode } from "../model/DependencyNode";
import { DependencyManager } from "../model/DependencyManager";
import { VSCodeDiagnosticsService } from "../services/VSCodeDiagnosticsService";
import { VSCodeDocumentService } from "../services/VSCodeDocumentService";

/**
 * Context for a pipeline processor.
 */
export class PipelineContext {
  // Public Properties ===============================================================================================

  public diagnostics: vscode.Diagnostic[] = [];
  /** Populated by CompilationProcessor */
  public compiledStory?: any; // Will be Story, but avoid inkjs import here

  /**
   * Map of all include TextDocuments, keyed by their include path (as written in the INCLUDE statement).
   * Populated by IncludeExtractionProcessor. Does not include the root document.
   */
  public includeDocuments: Map<string, vscode.TextDocument> = new Map();

  // Private Properties ===============================================================================================
  private cachedDoc?: vscode.TextDocument;
  private readonly docService: VSCodeDocumentService;

  // Constructor ======================================================================================================

  constructor(
    public readonly currentUri: vscode.Uri,
    private readonly diagnosticsService: VSCodeDiagnosticsService,
    docService: VSCodeDocumentService
  ) {
    this.docService = docService;
  }

  // Public Methods ===================================================================================================

  public async getText(): Promise<string> {
    const doc = await this.getTextDocument();
    return doc.getText();
  }

  public async getTextDocument(): Promise<vscode.TextDocument> {
    if (this.cachedDoc) {
      return this.cachedDoc;
    }
    this.cachedDoc = await this.docService.getTextDocument(this.currentUri);
    return this.cachedDoc;
  }

  public report(
    range: vscode.Range,
    message: string,
    severity: vscode.DiagnosticSeverity = vscode.DiagnosticSeverity.Error
  ) {
    this.diagnostics.push(new vscode.Diagnostic(range, message, severity));
  }

  public flushDiagnostics() {
    this.diagnosticsService.set(this.currentUri, this.diagnostics);
    this.diagnostics = [];
  }

  public resetDeps() {
    const node = DependencyManager.getInstance().getNode(this.currentUri)!;
    for (const dep of node.deps) {
      DependencyManager.getInstance()
        .getNode(dep)!
        .revDeps.delete(this.currentUri);
    }
    node.deps.clear();
  }

  public addDep(dep: vscode.Uri) {
    const depManager = DependencyManager.getInstance();
    if (!depManager.getNode(dep)) {
      depManager.setNode(dep, DependencyNode.fromUri(dep, 0));
    }
    const node = depManager.getNode(this.currentUri)!;
    node.deps.add(dep);
    depManager.getNode(dep)!.revDeps.add(this.currentUri);
  }
}
