// Modular InkOutlineParser with strategy-based symbol parsing
import * as vscode from "vscode";

// Strategy interface
interface InkSymbolParser {
  tryParse(
    line: string,
    lineNumber: number,
    context: InkParserContext
  ): vscode.DocumentSymbol | null;
}

// Context class to hold state like current knot or list
class InkParserContext {
  public currentKnot: vscode.DocumentSymbol | null = null;
  public currentList: vscode.DocumentSymbol | null = null;
}

// Knot parser
class KnotParser implements InkSymbolParser {
  private regex = /^===\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:\((.*?)\))?\s*===\s*$/;

  tryParse(
    line: string,
    lineNumber: number,
    context: InkParserContext
  ): vscode.DocumentSymbol | null {
    const match = this.regex.exec(line.trim());
    if (!match) {
      return null;
    }
    const [_, name, params] = match;
    const range = new vscode.Range(lineNumber, 0, lineNumber, line.length);
    const symbol = new vscode.DocumentSymbol(
      name + (params ? `(${params})` : ""),
      "Knot",
      vscode.SymbolKind.Namespace,
      range,
      range
    );
    context.currentKnot = symbol;
    return symbol;
  }
}

// Stitch parser
class StitchParser implements InkSymbolParser {
  private regex = /^=\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:\((.*?)\))?\s*$/;

  tryParse(
    line: string,
    lineNumber: number,
    context: InkParserContext
  ): vscode.DocumentSymbol | null {
    const match = this.regex.exec(line.trim());
    if (!match) {
      return null;
    }
    const [_, name, params] = match;
    const range = new vscode.Range(lineNumber, 0, lineNumber, line.length);
    const symbol = new vscode.DocumentSymbol(
      name + (params ? `(${params})` : ""),
      "Stitch",
      vscode.SymbolKind.Method,
      range,
      range
    );
    if (context.currentKnot) {
      context.currentKnot.children.push(symbol);
      return null;
    }
    return symbol;
  }
}

// Function parser
class FunctionParser implements InkSymbolParser {
  private regex =
    /^==+\s*function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\((.*?)\)\s*(==+)?\s*$/;

  tryParse(
    line: string,
    lineNumber: number,
    context: InkParserContext
  ): vscode.DocumentSymbol | null {
    const match = this.regex.exec(line.trim());
    if (!match) {
      return null;
    }
    const [_, name, params] = match;
    const range = new vscode.Range(lineNumber, 0, lineNumber, line.length);
    return new vscode.DocumentSymbol(
      `${name}(${params})`,
      "Function",
      vscode.SymbolKind.Function,
      range,
      range
    );
  }
}

// External function parser
class ExternalParser implements InkSymbolParser {
  private regex = /^EXTERNAL\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:\((.*?)\))?\s*$/;

  tryParse(
    line: string,
    lineNumber: number,
    context: InkParserContext
  ): vscode.DocumentSymbol | null {
    const match = this.regex.exec(line.trim());
    if (!match) {
      return null;
    }
    const [_, name, params] = match;
    const range = new vscode.Range(lineNumber, 0, lineNumber, line.length);
    return new vscode.DocumentSymbol(
      name + (params ? `(${params})` : ""),
      "External Function",
      vscode.SymbolKind.Interface,
      range,
      range
    );
  }
}

// VAR parser
class VariableParser implements InkSymbolParser {
  private regex = /^VAR\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=/;

  tryParse(
    line: string,
    lineNumber: number,
    context: InkParserContext
  ): vscode.DocumentSymbol | null {
    const match = this.regex.exec(line.trim());
    if (!match) {
      return null;
    }
    const [_, name] = match;
    const range = new vscode.Range(lineNumber, 0, lineNumber, line.length);
    return new vscode.DocumentSymbol(
      name,
      "Variable",
      vscode.SymbolKind.Variable,
      range,
      range
    );
  }
}

// INCLUDE parser
class IncludeParser implements InkSymbolParser {
  private regex = /^INCLUDE\s+(.+\.ink)\s*$/;

  tryParse(
    line: string,
    lineNumber: number,
    context: InkParserContext
  ): vscode.DocumentSymbol | null {
    const match = this.regex.exec(line.trim());
    if (!match) {
      return null;
    }
    const [_, path] = match;
    const range = new vscode.Range(lineNumber, 0, lineNumber, line.length);
    return new vscode.DocumentSymbol(
      path,
      "Include File",
      vscode.SymbolKind.File,
      range,
      range
    );
  }
}

// Main parser class
export class InkOutlineParser {
  private static instance: InkOutlineParser | null = null;
  private strategies: InkSymbolParser[];

  public static getInstance(): InkOutlineParser {
    if (!this.instance) {
      this.instance = new InkOutlineParser();
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
    const context = new InkParserContext();

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
