import * as vscode from "vscode";
import { ExtensionSystem } from "../ExtensionSystem";
import { OutlineParser } from "./OutlineParser";
import { OutlineManager } from "../dependencies/OutlineManager";
import { mapOutlineEntitiesToSymbols } from "./OutlineEntityToSymbolMapper";

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
          const outlineManager = OutlineManager.getInstance();
          let entities = outlineManager.getOutline(document.uri);

          if (!entities) {
            entities = this.outlineParser.parse(document);
            outlineManager.setOutline(document.uri, entities);
          }

          return mapOutlineEntitiesToSymbols(entities);
        },
      }
    );

    context.subscriptions.push(outlineProvider);
  }

  dispose(): void {
    // No explicit resources to dispose in this implementation
  }
}
