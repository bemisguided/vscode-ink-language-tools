import * as vscode from "vscode";
import { BuildEngine } from "./BuildEngine";
import { IncludeExtractionProcessor } from "./IncludeExtractionProcessor";
import { MockExtractionProcessor } from "./MockExtractionProcessor";
import { CompilationProcessor } from "./CompilationProcessor";
import { PartialStoryDependencyNode } from "../dependencies/PartialStoryDependencyNode";
import { ExternalFunctionDependencyNode } from "../dependencies/ExternalFunctionDependencyNode";
import { ExtensionSystem } from "../ExtensionSystem";

export class BuildSystem implements ExtensionSystem {
  private engine: BuildEngine;
  private inkWatcher!: vscode.FileSystemWatcher;
  private jsWatcher!: vscode.FileSystemWatcher;

  constructor(
    private readonly diagnosticCollection: vscode.DiagnosticCollection
  ) {
    this.engine = BuildEngine.getInstance(diagnosticCollection);
  }

  activate(context: vscode.ExtensionContext): void {
    // Register pipeline processors
    this.engine.registerProcessor(new IncludeExtractionProcessor());
    this.engine.registerProcessor(new MockExtractionProcessor());
    this.engine.registerProcessor(new CompilationProcessor());

    // Seed initial graph from workspace
    this.seedGraph().then(() => {
      for (const uri of this.engine.graph.keys()) {
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

    for (const uri of inkUris) {
      this.engine.graph.set(uri, new PartialStoryDependencyNode(uri, 0));
    }
    for (const uri of jsUris) {
      this.engine.graph.set(uri, new ExternalFunctionDependencyNode(uri, 0));
    }
  }

  private onCreate(uri: vscode.Uri): void {
    if (uri.path.endsWith(".ink")) {
      this.engine.graph.set(uri, new PartialStoryDependencyNode(uri, 0));
    } else if (uri.path.endsWith(".js")) {
      this.engine.graph.set(uri, new ExternalFunctionDependencyNode(uri, 0));
    }
    this.engine.onFileChanged(uri);
  }

  private onDelete(uri: vscode.Uri): void {
    this.engine.graph.delete(uri);
    this.diagnosticCollection.delete(uri);
  }
}
