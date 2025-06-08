import * as vscode from "vscode";
import { InkExtensionManager } from "./InkExtensionManager";

/**
 * VSCode Extension Framework Hook: Entry point for extension activation.
 * Called by VSCode when the extension is activated.
 * @param context The extension context provided by VSCode
 */
export function activate(context: vscode.ExtensionContext): void {
  InkExtensionManager.getInstance().activate(context);
}

/**
 * VSCode Extension Framework Hook: Entry point for extension deactivation.
 * Called by VSCode when the extension is deactivated.
 */
export function deactivate(): void {
  InkExtensionManager.getInstance().deactivate();
}
