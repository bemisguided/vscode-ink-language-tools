import * as vscode from "vscode";
import { OutlineSymbolParser } from "./OutlineSymbolParser";
import { OutlineParserContext } from "./OutlineParserContext";

export class ExternalParser implements OutlineSymbolParser {
  private regex = /^EXTERNAL\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:\((.*?)\))?\s*$/;

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
    return new vscode.DocumentSymbol(
      name + (params ? `(${params})` : ""),
      "External Function",
      vscode.SymbolKind.Interface,
      range,
      range
    );
  }
}
