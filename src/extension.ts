import * as vscode from "vscode";
import { ExtensionSystem } from "./ExtensionSystem";
import { BuildSystem } from "./BuildSystem";
import { OutlineSystem } from "./OutlineSystem";
import { CompileCommand } from "./CompileCommand";
import { PreviewCommand } from "./PreviewCommand";

let systems: ExtensionSystem[] = [];

/**
 * VSCode Extension Framework Hook: Entry point for extension activation.
 * Called by VSCode when the extension is activated.
 * @param context The extension context provided by VSCode
 */
export function activate(context: vscode.ExtensionContext): void {
  console.log("Activating Ink extension");
  const diagCollection = vscode.languages.createDiagnosticCollection("ink");
  systems.push(new OutlineSystem());
  systems.push(new BuildSystem(diagCollection));
  systems.push(new CompileCommand(diagCollection));
  systems.push(new PreviewCommand());
  systems.forEach((s) => s.activate(context));
}

/**
 * VSCode Extension Framework Hook: Entry point for extension deactivation.
 * Called by VSCode when the extension is deactivated.
 */
export function deactivate(): void {
  systems.forEach((s) => s.dispose());
  systems = [];
}
