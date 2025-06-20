import * as vscode from "vscode";
import { BuildEngine } from "../build/BuildEngine";
import { DependencyNode } from "../model/DependencyNode";
import { IExtensionPlugin } from "../IExtensionPlugin";
import { DependencyManager } from "../model/DependencyManager";
import { VSCodeServiceLocator } from "../services/VSCodeServiceLocator";
import { debounce } from "../util/debounce";

export class BuildSystem implements IExtensionPlugin {
  // Private Properties ===============================================================================================
  private engine: BuildEngine;
  private inkWatcher!: vscode.FileSystemWatcher;
  // private jsWatcher!: vscode.FileSystemWatcher;
  private recompile: (uri: vscode.Uri, delay: number) => void;

  // Constructor ======================================================================================================

  constructor() {
    this.engine = BuildEngine.getInstance();
    this.recompile = debounce((uri: vscode.Uri) => {
      this.engine.recompileDependents(uri);
    });
  }

  // Private Methods ===================================================================================================

  private getDebounceWait(): number {
    const debounceWait =
      VSCodeServiceLocator.getConfigurationService().get<number>(
        "ink.compile.behavior.debounceWait",
        500
      );
    return debounceWait ?? 500;
  }

  private async seedGraph(): Promise<void> {
    const inkUris = await vscode.workspace.findFiles("**/*.ink");
    // const jsUris = await vscode.workspace.findFiles("**/*.js");

    const depManager = DependencyManager.getInstance();
    for (const uri of inkUris) {
      depManager.setNode(uri, DependencyNode.fromUri(uri, 0));
    }
    // for (const uri of jsUris) {
    //   depManager.setNode(uri, DependencyNode.fromUri(uri, 0));
    // }
  }

  private onCreate(uri: vscode.Uri): void {
    const depManager = DependencyManager.getInstance();
    depManager.setNode(uri, DependencyNode.fromUri(uri, 0));
    this.engine.recompileDependents(uri);
  }

  private onDelete(uri: vscode.Uri): void {
    DependencyManager.getInstance().deleteNode(uri);
    this.engine.diagnostics.clear(uri);
  }

  private onDidChange(uri: vscode.Uri): void {
    const debounceWait = this.getDebounceWait();
    this.recompile(uri, debounceWait);
  }

  // Public Methods ===================================================================================================

  activate(context: vscode.ExtensionContext): void {
    // Seed initial graph from workspace
    this.seedGraph().then(() => {
      const depManager = DependencyManager.getInstance();
      for (const uri of depManager.getGraph().keys()) {
        if (uri.path.endsWith(".ink")) {
          this.engine.recompileDependents(uri);
        }
      }
    });

    // Setup filesystem watchers
    this.inkWatcher = vscode.workspace.createFileSystemWatcher("**/*.ink");
    // this.jsWatcher = vscode.workspace.createFileSystemWatcher("**/*.js");

    context.subscriptions.push(
      this.engine.diagnostics,
      this.inkWatcher,
      // this.jsWatcher,
      this.inkWatcher.onDidCreate((u) => this.onCreate(u)),
      this.inkWatcher.onDidChange((u) => this.onDidChange(u)),
      this.inkWatcher.onDidDelete((u) => this.onDelete(u))
      // this.jsWatcher.onDidCreate((u) => this.onCreate(u)),
      // this.jsWatcher.onDidChange((u) => this.engine.recompileDependents(u)),
      // this.jsWatcher.onDidDelete((u) => this.onDelete(u))
    );
  }

  dispose(): void {
    this.inkWatcher.dispose();
    // this.jsWatcher.dispose();
    this.engine.diagnostics.clear();
    this.engine.diagnostics.dispose();
  }
}
