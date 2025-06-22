import * as vscode from "vscode";
import { IExtensionPlugin } from "../IExtensionPlugin";
import { OutlineParser } from "../build/OutlineParser";
import { OutlineManager } from "../model/OutlineManager";
import { mapOutlineEntitiesToSymbols } from "../build/outline/mapOutlineEntitiesToSymbols";

export class OutlineSystem implements IExtensionPlugin {
  // Private Properties ===============================================================================================

  private outlineManager: OutlineManager;
  private outlineParser: OutlineParser;

  // Constructor ======================================================================================================

  constructor() {
    this.outlineManager = OutlineManager.getInstance();
    this.outlineParser = OutlineParser.getInstance();
  }

  // Public Methods ===================================================================================================

  /**
   * @inheritdoc
   */
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

  /**
   * Gets the document symbols for an Ink document.
   * @param document - The Ink document to get the symbols for.
   * @returns The document symbols.
   */
  public async getDocumentSymbols(
    document: vscode.TextDocument
  ): Promise<vscode.DocumentSymbol[]> {
    const entities = await this.outlineParser.parse(document);
    return mapOutlineEntitiesToSymbols(entities);
  }

  /**
   * @inheritdoc
   */
  dispose(): void {
    this.outlineManager.clear();
  }
}
