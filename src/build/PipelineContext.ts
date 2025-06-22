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
import { Story } from "inkjs/engine/Story";
import { IBuildDiagnostic } from "./IBuildDiagnostic";

/**
 * Context for a pipeline processor.
 */
export class PipelineContext {
  // Private Properties ===============================================================================================
  private readonly document: vscode.TextDocument;

  private readonly diagnostics = new Array<IBuildDiagnostic>();

  private readonly resolvedDependencies = new Map<vscode.Uri, vscode.Uri[]>();

  // Public Properties ===============================================================================================

  /**
   * The compiled Ink Story, if successful, for this PipelineContext.
   */
  public story?: Story;

  /**
   * Map of all included Ink Story TextDocuments for this PipelineContext.
   */
  public readonly includeDocuments: Map<string, vscode.TextDocument> =
    new Map();

  /**
   * The URI of the current document for this PipelineContext.
   */
  public readonly uri: vscode.Uri;

  // Constructor ======================================================================================================

  constructor(uri: vscode.Uri, document: vscode.TextDocument) {
    this.uri = uri;
    this.document = document;
  }

  // Public Methods ===================================================================================================

  /**
   * Add a dependency relationship to the PipelineContext.
   * @param dependent The dependent URI.
   * @param dependency The dependency URI.
   */
  public addDependency(dependent: vscode.Uri, dependency: vscode.Uri) {
    this.resolvedDependencies.set(dependent, [
      ...(this.resolvedDependencies.get(dependent) || []),
      dependency,
    ]);
  }

  /**
   * Dump the diagnostics to the console.
   */
  public dumpDiagnostics() {
    let output = "";
    for (const diagnostic of this.diagnostics) {
      output += `${diagnostic.uri.fsPath}:${diagnostic.range.start.line}:${diagnostic.range.start.character} - ${diagnostic.message}\n`;
    }
    console.log(output);
  }

  /**
   * Filter the diagnostics collected for this PipelineContext.
   * @param filter The filter to apply to the diagnostics.
   * @returns The filtered diagnostics.
   */
  public filterDiagnostics(
    filter: (diagnostic: IBuildDiagnostic) => boolean
  ): IBuildDiagnostic[] {
    return this.diagnostics.filter(filter);
  }

  /**
   * Filter the diagnostics collected for this PipelineContext by severity.
   * @param severity The severity to filter by.
   * @returns The filtered diagnostics.
   */
  public filterDiagnosticsBySeverity(
    severity: vscode.DiagnosticSeverity
  ): IBuildDiagnostic[] {
    return this.filterDiagnostics((d) => d.severity === severity);
  }

  /**
   * Get all dependencies for this PipelineContext.
   * @returns The dependencies for this PipelineContext.
   */
  public getDependencies(): Map<vscode.Uri, vscode.Uri[]> {
    return this.resolvedDependencies;
  }

  /**
   * Get the diagnostics collected for this PipelineContext.
   * @returns The diagnostics collected for this PipelineContext.
   */
  public getDiagnostics(): Readonly<IBuildDiagnostic[]> {
    return this.diagnostics;
  }

  /**
   * Get the text of the current document.
   * @returns The text of the current document.
   */
  public getText(): string {
    return this.document.getText();
  }

  /**
   * Get the current document.
   * @returns The current document.
   */
  public getTextDocument(): vscode.TextDocument {
    return this.document;
  }

  /**
   * Check if the PipelineContext has error level diagnostics.
   * @returns True if the PipelineContext has errors, false otherwise.
   */
  public hasErrors(): boolean {
    return (
      this.filterDiagnosticsBySeverity(vscode.DiagnosticSeverity.Error).length >
      0
    );
  }

  /**
   * Check if the PipelineContext has warning level diagnostics.
   * @returns True if the PipelineContext has warnings, false otherwise.
   */
  public hasWarnings(): boolean {
    return (
      this.filterDiagnosticsBySeverity(vscode.DiagnosticSeverity.Warning)
        .length > 0
    );
  }

  /**
   * Check if the PipelineContext has information.
   * @returns True if the PipelineContext has information, false otherwise.
   */
  public hasInformation(): boolean {
    return (
      this.filterDiagnosticsBySeverity(vscode.DiagnosticSeverity.Information)
        .length > 0
    );
  }

  /**
   * Report a diagnostic for the PipelineContext.
   * @param range The range of the diagnostic.
   * @param message The message of the diagnostic.
   * @param severity The severity of the diagnostic.
   */
  public reportDiagnostic(
    range: vscode.Range,
    message: string,
    severity: vscode.DiagnosticSeverity = vscode.DiagnosticSeverity.Error
  ) {
    this.diagnostics.push({
      uri: this.uri,
      range,
      message,
      severity,
    });
  }
}
