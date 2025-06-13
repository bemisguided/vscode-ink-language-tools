// Modular InkOutlineParser with strategy-based symbol parsing
import * as vscode from "vscode";
import { KnotParser } from "./KnotParser";
import { StitchParser } from "./StitchParser";
import { FunctionParser } from "./FunctionParser";
import { ExternalParser } from "./ExternalParser";
import { VariableParser } from "./VariableParser";
import { IncludeParser } from "./IncludeParser";
import { OutlineParserContext } from "./OutlineParserContext";

export class OutlineParser {
  private static instance: OutlineParser | null = null;
  private strategies: any[];

  public static getInstance(): OutlineParser {
    if (!this.instance) {
      this.instance = new OutlineParser();
    }
    return this.instance;
  }

  private constructor() {
    this.strategies = [
      new KnotParser(),
      new StitchParser(),
      new FunctionParser(),
      new ExternalParser(),
      new VariableParser(),
      new IncludeParser(),
    ];
  }

  public parse(document: vscode.TextDocument): vscode.DocumentSymbol[] {
    const symbols: vscode.DocumentSymbol[] = [];
    const lines = document.getText().split(/\r?\n/);
    const context = new OutlineParserContext();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      if (trimmed === "" || trimmed.startsWith("//")) {
        continue;
      }

      let handled = false;
      for (const strategy of this.strategies) {
        const symbol = strategy.tryParse(line, i, context);
        if (symbol) {
          symbols.push(symbol);
          handled = true;
          break;
        }
      }

      // List continuation
      if (context.currentList && !handled && line.startsWith(" ")) {
        const listItemMatch =
          /^\s+([a-zA-Z_][a-zA-Z0-9_]*)(\s*=\s*\d+)?\s*$/.exec(line);
        if (listItemMatch) {
          const [_, name] = listItemMatch;
          const range = new vscode.Range(i, 0, i, line.length);
          context.currentList.children.push(
            new vscode.DocumentSymbol(
              name,
              "List Item",
              vscode.SymbolKind.EnumMember,
              range,
              range
            )
          );
          continue;
        } else {
          context.currentList = null;
        }
      }

      // List start (handled here because it requires context tracking)
      const listStartMatch =
        /^LIST\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:=\s*(.*))?$/.exec(trimmed);
      if (listStartMatch) {
        const [_, listName, inlineItems] = listStartMatch;
        const range = new vscode.Range(i, 0, i, line.length);
        const listSymbol = new vscode.DocumentSymbol(
          listName,
          "List",
          vscode.SymbolKind.Enum,
          range,
          range
        );
        if (inlineItems) {
          const items = inlineItems.split(",").map((s) => s.trim());
          for (const item of items) {
            listSymbol.children.push(
              new vscode.DocumentSymbol(
                item,
                "List Item",
                vscode.SymbolKind.EnumMember,
                range,
                range
              )
            );
          }
        } else {
          context.currentList = listSymbol;
        }
        symbols.push(listSymbol);
      } else {
        context.currentList = null;
      }
    }

    return symbols;
  }
}
