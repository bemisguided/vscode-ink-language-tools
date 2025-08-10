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
import path from "path";
import { PreviewController } from "./PreviewController";
import { PreviewStoryManager } from "./PreviewStoryManager";
import { BuildEngine } from "../build/BuildEngine";
import { IBuildResult, ISuccessfulBuildResult } from "../build/IBuildResult";
import { FunctionStoryEvent } from "./PreviewState";
import { VSCodeServiceLocator } from "../services/VSCodeServiceLocator";

export class PreviewManager {
  // Private Static Properties ========================================================================================

  private static instance: PreviewManager | undefined;

  // Private Properties ===============================================================================================

  private readonly webviewPanel: vscode.WebviewPanel;
  private readonly controller: PreviewController;
  private uri: vscode.Uri | undefined;
  private version: number = 0;
  private storyManager?: PreviewStoryManager;

  // Public Static Methods ============================================================================================

  public static getInstance(): PreviewManager {
    const column = vscode.window.activeTextEditor
      ? vscode.ViewColumn.Beside
      : undefined;

    // If we already have a panel, show it
    if (PreviewManager.instance) {
      PreviewManager.instance.webviewPanel.reveal(column);
      return PreviewManager.instance;
    }

    // Otherwise, create a new panel
    PreviewManager.instance = new PreviewManager();
    return PreviewManager.instance;
  }

  // Constructor ======================================================================================================

  private constructor() {
    this.webviewPanel = vscode.window.createWebviewPanel(
      "inkPreview",
      "Ink Preview",
      vscode.ViewColumn.Beside,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        enableFindWidget: true,
        localResourceRoots:
          VSCodeServiceLocator.getExtensionService().getWebviewLocalResourceRoots(),
      }
    );

    // Set the icon for the webview panel
    this.webviewPanel.iconPath =
      VSCodeServiceLocator.getExtensionService().getIconUri("ink.png");

    this.controller = new PreviewController(this.webviewPanel);

    this.webviewPanel.onDidDispose(() => this.dispose());

    // Register for compilation events
    this.registerForCompilationEvents();
  }

  // Public Methods ===================================================================================================

  /**
   * Main preview method - now handles compilation and setup
   */
  public async preview(document: vscode.TextDocument): Promise<void> {
    if (
      this.uri &&
      this.uri === document.uri &&
      this.version === document.version
    ) {
      return;
    }

    this.uri = document.uri;
    this.version = document.version;

    // Update the preview panel title
    this.setTitle(document.uri.fsPath);

    // Compile the story
    const buildResult = await this.compileStory(document.uri);
    if (!buildResult.success) {
      await this.controller.showCompilationError();
      return;
    }

    // Set up story management
    await this.initializeStoryPreview(buildResult as ISuccessfulBuildResult);
  }

  public dispose(): void {
    console.debug("[PreviewManager] 🗑️ Disposing manager");

    // Unregister from compilation events
    const engine = BuildEngine.getInstance();
    engine.offDidStoryCompile("preview-manager");

    this.controller.dispose();
    this.webviewPanel.dispose();
    PreviewManager.instance = undefined;
  }

  // Private Methods ==================================================================================================

  /**
   * Compile story using BuildEngine
   */
  private async compileStory(uri: vscode.Uri): Promise<IBuildResult> {
    const engine = BuildEngine.getInstance();
    return await engine.compileStory(uri);
  }

  /**
   * Initializes the Preview Manager with a Preview Story Manager with a new Ink Story.
   */
  private async initializeStoryPreview(
    compiledStory: ISuccessfulBuildResult
  ): Promise<void> {
    this.storyManager = new PreviewStoryManager(compiledStory.story);
    this.setupExternalFunctions(compiledStory);
    await this.controller.initializeStory(this.storyManager);
  }

  /**
   * Register for BuildEngine compilation events
   */
  private registerForCompilationEvents(): void {
    const engine = BuildEngine.getInstance();
    engine.onDidStoryCompile("preview-manager", (result) => {
      this.handleStoryRecompiled(result);
    });
  }

  /**
   * Handle story recompilation from BuildEngine events
   */
  private async handleStoryRecompiled(
    result: ISuccessfulBuildResult
  ): Promise<void> {
    // Only handle if this is for our currently previewed file
    if (!this.uri || result.uri.toString() !== this.uri.toString()) {
      return;
    }

    // Check if live-update is enabled
    const currentState = this.controller.getState();
    if (!currentState.ui.liveUpdateEnabled) {
      return;
    }

    console.debug("[PreviewManager] 🔄 Story recompiled, triggering replay");

    // Set up new story with recompiled result
    this.storyManager = new PreviewStoryManager(result.story);
    this.setupExternalFunctions(result);

    // Simply update the story manager and replay existing history
    await this.controller.refreshStory(this.storyManager);
  }

  /**
   * Set up external functions (moved from PreviewController)
   */
  private setupExternalFunctions(compiledStory: ISuccessfulBuildResult): void {
    if (!compiledStory.externalFunctionVM || !this.storyManager) {
      return;
    }

    const availableFunctions =
      compiledStory.externalFunctionVM.getFunctionNames();
    if (availableFunctions.length === 0) {
      return;
    }

    const failedBindings = compiledStory.externalFunctionVM.bindFunctions(
      compiledStory.story,
      availableFunctions,
      (functionName, args, result) => {
        const functionEvent: FunctionStoryEvent = {
          type: "function",
          functionName,
          args,
          result,
          isCurrent: true,
        };
        this.controller.addFunctionEvent(functionEvent);
      }
    );

    if (failedBindings.length > 0) {
      const errors = failedBindings.map((funcName) => ({
        message: `Failed to bind external function: ${funcName}`,
        severity: "error" as const,
      }));
      this.controller.showErrors(errors);
    }
  }

  /**
   * Sets the title of the webview panel.
   */
  private setTitle(fileName: string): void {
    this.webviewPanel.title = `${path.basename(fileName)} (Preview)`;
  }
}
