import * as vscode from "vscode";
import { InkExtensionManager } from "./InkExtensionManager";
import { ExtensionSystem } from "./ExtensionSystem";
import { BuildSystem } from "./build/BuildSystem";
import { OutlineSystem } from "./outline/OutlineSystem";
import { CompileCommand } from "./CompileCommand";
import { PreviewCommand } from "./PreviewCommand";

/**
 * VSCode Extension Framework Hook: Entry point for extension activation.
 * Called by VSCode when the extension is activated.
 * @param context The extension context provided by VSCode
 */
// export function activate(context: vscode.ExtensionContext): void {
//   InkExtensionManager.getInstance().activate(context);
// }

/**
 * VSCode Extension Framework Hook: Entry point for extension deactivation.
 * Called by VSCode when the extension is deactivated.
 */
// export function deactivate(): void {
//   InkExtensionManager.getInstance().deactivate();
// }

let systems: ExtensionSystem[] = [];

/**
 * VSCode Extension Framework Hook: Entry point for extension activation.
 * Called by VSCode when the extension is activated.
 * @param context The extension context provided by VSCode
 */
export function activate(context: vscode.ExtensionContext): void {
  const diagCollection = vscode.languages.createDiagnosticCollection("ink");
  systems.push(new BuildSystem(diagCollection));
  systems.push(new OutlineSystem());
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
