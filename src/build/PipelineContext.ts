import * as vscode from "vscode";
import { DependencyNode } from "../dependencies/DependencyNode";

export class PipelineContext {
  public diagnostics: vscode.Diagnostic[] = [];
  /** Populated by CompilationProcessor */
  public compiledStory?: any; // Will be Story, but avoid inkjs import here

  constructor(
    public readonly graph: Map<vscode.Uri, DependencyNode>,
    public readonly currentUri: vscode.Uri,
    private readonly diagnosticCollection: vscode.DiagnosticCollection
  ) {}

  async getText(): Promise<string> {
    const doc = await vscode.workspace.openTextDocument(this.currentUri);
    return doc.getText();
  }

  report(
    range: vscode.Range,
    message: string,
    severity: vscode.DiagnosticSeverity = vscode.DiagnosticSeverity.Error
  ) {
    this.diagnostics.push(new vscode.Diagnostic(range, message, severity));
  }

  flushDiagnostics() {
    this.diagnosticCollection.set(this.currentUri, this.diagnostics);
    this.diagnostics = [];
  }

  resetDeps() {
    const node = this.graph.get(this.currentUri)!;
    for (const dep of node.deps) {
      this.graph.get(dep)!.revDeps.delete(this.currentUri);
    }
    node.deps.clear();
  }

  addDep(dep: vscode.Uri) {
    const node = this.graph.get(this.currentUri)!;
    node.deps.add(dep);
    this.graph.get(dep)!.revDeps.add(this.currentUri);
  }
}
