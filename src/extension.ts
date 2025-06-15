import * as vscode from "vscode";
import { IExtensionPlugin } from "./ExtensionSystem";
import { BuildSystem } from "./systems/BuildSystem";
import { OutlineSystem } from "./systems/OutlineSystem";
import { CompileCommand } from "./commands/CompileCommand";
import { PreviewCommand } from "./commands/PreviewCommand";

let systems: IExtensionPlugin[] = [];

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
