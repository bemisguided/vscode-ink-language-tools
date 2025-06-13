import * as vscode from "vscode";
import { ExtensionSystem } from "../ExtensionSystem";
import { OutlineParser } from "./OutlineParser";

export class OutlineSystem implements ExtensionSystem {
  private outlineParser: OutlineParser;

  constructor() {
    this.outlineParser = OutlineParser.getInstance();
  }

  activate(context: vscode.ExtensionContext): void {
    // Register DocumentSymbolProvider for Ink files
    const outlineProvider = vscode.languages.registerDocumentSymbolProvider(
      { language: "ink" },
      {
        provideDocumentSymbols: (document) => {
          return this.outlineParser.parse(document);
        },
      }
    );

    context.subscriptions.push(outlineProvider);
  }

  dispose(): void {
    // No explicit resources to dispose in this implementation
  }
}
