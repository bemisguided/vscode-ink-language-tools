import * as vscode from "vscode";
import { OutlineSymbolParser } from "./OutlineSymbolParser";
import { OutlineParserContext } from "./OutlineParserContext";

export class StitchParser implements OutlineSymbolParser {
  private regex = /^=\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:\((.*?)\))?\s*$/;

  tryParse(
    line: string,
    lineNumber: number,
    context: OutlineParserContext
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
