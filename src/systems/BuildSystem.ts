import * as vscode from "vscode";
import { BuildEngine } from "../build/BuildEngine";
import { IncludeExtractionProcessor } from "../build/IncludeExtractionProcessor";
import { MockExtractionProcessor } from "../build/MockExtractionProcessor";
import { CompilationProcessor } from "../build/compiler/CompilationProcessor";
import { OutlineProcessor } from "../build/outline/OutlineProcessor";
import { DependencyNode, DependencyNodeType } from "../model/DependencyNode";
import { IExtensionPlugin } from "../IExtensionPlugin";
import { DependencyManager } from "../model/DependencyManager";

export class BuildSystem implements IExtensionPlugin {
  private engine: BuildEngine;
  private inkWatcher!: vscode.FileSystemWatcher;
  private jsWatcher!: vscode.FileSystemWatcher;

  constructor(
    private readonly diagnosticCollection: vscode.DiagnosticCollection
  ) {
    this.engine = BuildEngine.getInstance(diagnosticCollection);
  }

  activate(context: vscode.ExtensionContext): void {
    // Seed initial graph from workspace
    this.seedGraph().then(() => {
      const depManager = DependencyManager.getInstance();
      for (const uri of depManager.getGraph().keys()) {
        if (uri.path.endsWith(".ink")) {
          this.engine.onFileChanged(uri);
        }
      }
    });

    // Setup filesystem watchers
    this.inkWatcher = vscode.workspace.createFileSystemWatcher("**/*.ink");
    this.jsWatcher = vscode.workspace.createFileSystemWatcher("**/*.js");

    context.subscriptions.push(
      this.diagnosticCollection,
      this.inkWatcher,
      this.jsWatcher,
      this.inkWatcher.onDidCreate((u) => this.onCreate(u)),
      this.inkWatcher.onDidChange((u) => this.engine.onFileChanged(u)),
      this.inkWatcher.onDidDelete((u) => this.onDelete(u)),
      this.jsWatcher.onDidCreate((u) => this.onCreate(u)),
      this.jsWatcher.onDidChange((u) => this.engine.onFileChanged(u)),
      this.jsWatcher.onDidDelete((u) => this.onDelete(u))
    );
  }

  dispose(): void {
    this.inkWatcher.dispose();
    this.jsWatcher.dispose();
    this.diagnosticCollection.clear();
    this.diagnosticCollection.dispose();
  }

  private async seedGraph(): Promise<void> {
    const inkUris = await vscode.workspace.findFiles("**/*.ink");
    const jsUris = await vscode.workspace.findFiles("**/*.js");

    const depManager = DependencyManager.getInstance();
    for (const uri of inkUris) {
      depManager.setNode(uri, DependencyNode.fromUri(uri, 0));
    }
    for (const uri of jsUris) {
      depManager.setNode(uri, DependencyNode.fromUri(uri, 0));
    }
  }

  private onCreate(uri: vscode.Uri): void {
    const depManager = DependencyManager.getInstance();
    depManager.setNode(uri, DependencyNode.fromUri(uri, 0));
    this.engine.onFileChanged(uri);
  }

  private onDelete(uri: vscode.Uri): void {
    DependencyManager.getInstance().deleteNode(uri);
    this.diagnosticCollection.delete(uri);
  }
}
