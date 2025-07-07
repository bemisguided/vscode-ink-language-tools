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
import { IExtensionPlugin } from "./IExtensionPlugin";
import { BuildSystem } from "./systems/BuildSystem";
import { OutlineSystem } from "./systems/OutlineSystem";
import { CompileCommand } from "./commands/CompileCommand";
import { PreviewCommand } from "./commands/PreviewCommand";
import { VSCodeServiceLocator } from "./services/VSCodeServiceLocator";
import { VSCodeDiagnosticsServiceImpl } from "./services/VSCodeDiagnosticsService";
import { VSCodeDocumentServiceImpl } from "./services/VSCodeDocumentService";
import { VSCodeConfigurationServiceImpl } from "./services/VSCodeConfigurationService";
import { VSCodeExtensionServiceImpl } from "./services/VSCodeExtensionService";
import { VSCodeWorkspaceNavigationServiceImpl } from "./services/VSCodeWorkspaceNavigationService";

let systems: IExtensionPlugin[] = [];

/**
 * VSCode Extension Framework Hook: Entry point for extension activation.
 * Called by VSCode when the extension is activated.
 * @param context The extension context provided by VSCode
 */
export function activate(context: vscode.ExtensionContext): void {
  console.log("vscode-ink-language-tools: Activating");

  // Setup Configuration Service
  const configurationService = new VSCodeConfigurationServiceImpl();

  // Setup Diagnostics Service
  const diagnostics = vscode.languages.createDiagnosticCollection();
  const diagnosticsService = new VSCodeDiagnosticsServiceImpl(diagnostics);
  context.subscriptions.push(diagnosticsService);

  // Setup Document Service
  const documentService = new VSCodeDocumentServiceImpl(configurationService);
  context.subscriptions.push(documentService);

  // Setup Extension Service
  const extensionService = new VSCodeExtensionServiceImpl();
  context.subscriptions.push(extensionService);

  // Setup Workspace Navigation Service
  const workspaceNavigationService = new VSCodeWorkspaceNavigationServiceImpl();
  context.subscriptions.push(workspaceNavigationService);

  // Setup Service Locator
  VSCodeServiceLocator.setConfigurationService(configurationService);
  VSCodeServiceLocator.setDiagnosticsService(diagnosticsService);
  VSCodeServiceLocator.setDocumentService(documentService);
  VSCodeServiceLocator.setExtensionService(extensionService);
  VSCodeServiceLocator.setWorkspaceNavigationService(
    workspaceNavigationService
  );

  // Setup Systems
  systems.push(new OutlineSystem());
  systems.push(new BuildSystem());
  systems.push(new CompileCommand());
  systems.push(new PreviewCommand());
  systems.forEach((s) => s.activate(context));
}

/**
 * VSCode Extension Framework Hook: Entry point for extension deactivation.
 * Called by VSCode when the extension is deactivated.
 */
export function deactivate(): void {
  console.log("vscode-ink-language-tools: Deactivating");
  systems.forEach((s) => s.dispose());
  systems = [];
}
