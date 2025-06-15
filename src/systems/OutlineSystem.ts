import * as vscode from "vscode";
import { IExtensionPlugin } from "../IExtensionPlugin";
import { OutlineParser } from "../build/outline/OutlineParser";
import { OutlineManager } from "../model/OutlineManager";
import { mapOutlineEntitiesToSymbols } from "../build/outline/mapOutlineEntitiesToSymbols";

export class OutlineSystem implements IExtensionPlugin {
  private outlineManager: OutlineManager;
  private outlineParser: OutlineParser;

  constructor() {
    this.outlineManager = OutlineManager.getInstance();
    this.outlineParser = OutlineParser.getInstance();
  }

  activate(context: vscode.ExtensionContext): void {
    // Register DocumentSymbolProvider for Ink files
    const outlineProvider = vscode.languages.registerDocumentSymbolProvider(
      { language: "ink" },
      {
        provideDocumentSymbols: async (document) => {
          return this.getDocumentSymbols(document);
        },
      }
    );

    context.subscriptions.push(outlineProvider);
  }

  public async getDocumentSymbols(
    document: vscode.TextDocument
  ): Promise<vscode.DocumentSymbol[]> {
    let entities = this.outlineManager.getOutline(document.uri);

    if (!entities) {
      entities = await this.outlineParser.parse(document);
      this.outlineManager.setOutline(document.uri, entities);
    }

    return mapOutlineEntitiesToSymbols(entities);
  }

  dispose(): void {
    this.outlineManager.clear();
  }
}
