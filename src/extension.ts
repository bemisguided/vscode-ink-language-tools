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
