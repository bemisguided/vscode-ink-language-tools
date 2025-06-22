import * as vscode from "vscode";
import { BuildEngine } from "../build/BuildEngine";
import { IExtensionPlugin } from "../IExtensionPlugin";
import { DependencyManager } from "../model/DependencyManager";
import { VSCodeServiceLocator } from "../services/VSCodeServiceLocator";
import { debounce } from "../util/debounce";

export class BuildSystem implements IExtensionPlugin {
  // Private Properties ===============================================================================================
  private engine: BuildEngine;
  private inkWatcher!: vscode.FileSystemWatcher;
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

  private async seedGraph(): Promise<vscode.Uri[]> {
    const inkUris = await vscode.workspace.findFiles("**/*.ink");

    const depManager = DependencyManager.getInstance();
    for (const uri of inkUris) {
      depManager.createNode(uri);
    }

    return inkUris;
  }

  private onCreate(uri: vscode.Uri): void {
    const depManager = DependencyManager.getInstance();
    depManager.createNode(uri);
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

  /**
   * @inheritdoc
   */
  activate(context: vscode.ExtensionContext): void {
    // Seed initial graph from workspace
    this.seedGraph().then((inkUris) => {
      for (const uri of inkUris) {
        if (uri.path.endsWith(".ink")) {
          this.engine.recompileDependents(uri);
        }
      }
    });

    // Setup filesystem watchers
    this.inkWatcher = vscode.workspace.createFileSystemWatcher("**/*.ink");

    context.subscriptions.push(
      this.engine.diagnostics,
      this.inkWatcher,
      this.inkWatcher.onDidCreate((u) => this.onCreate(u)),
      this.inkWatcher.onDidChange((u) => this.onDidChange(u)),
      this.inkWatcher.onDidDelete((u) => this.onDelete(u))
    );
  }

  /**
   * @inheritdoc
   */
  dispose(): void {
    this.inkWatcher.dispose();
    this.engine.diagnostics.clear();
    this.engine.diagnostics.dispose();
  }
}
