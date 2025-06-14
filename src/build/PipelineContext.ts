import * as vscode from "vscode";
import { DependencyNode, DependencyNodeType } from "../model/DependencyNode";
import { DependencyManager } from "../model/DependencyManager";

export class PipelineContext {
  public diagnostics: vscode.Diagnostic[] = [];
  /** Populated by CompilationProcessor */
  public compiledStory?: any; // Will be Story, but avoid inkjs import here
  private cachedDoc?: vscode.TextDocument;

  constructor(
    public readonly currentUri: vscode.Uri,
    private readonly diagnosticCollection: vscode.DiagnosticCollection
  ) {}

  async getText(): Promise<string> {
    const doc = await this.getTextDocument();
    return doc.getText();
  }

  async getTextDocument(): Promise<vscode.TextDocument> {
    if (this.cachedDoc) {
      return this.cachedDoc;
    }
    this.cachedDoc = await vscode.workspace.openTextDocument(this.currentUri);
    return this.cachedDoc;
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
    const node = DependencyManager.getInstance().getNode(this.currentUri)!;
    for (const dep of node.deps) {
      DependencyManager.getInstance()
        .getNode(dep)!
        .revDeps.delete(this.currentUri);
    }
    node.deps.clear();
  }

  addDep(dep: vscode.Uri) {
    const depManager = DependencyManager.getInstance();
    if (!depManager.getNode(dep)) {
      depManager.setNode(dep, DependencyNode.fromUri(dep, 0));
    }
    const node = depManager.getNode(this.currentUri)!;
    node.deps.add(dep);
    depManager.getNode(dep)!.revDeps.add(this.currentUri);
  }
}
