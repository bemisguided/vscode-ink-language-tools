import * as vscode from "vscode";
import { OutlineSymbolParser } from "./OutlineSymbolParser";
import { OutlineParserContext } from "./OutlineParserContext";

export class IncludeParser implements OutlineSymbolParser {
  private regex = /^INCLUDE\s+(.+\.ink)\s*$/;

  tryParse(
    line: string,
    lineNumber: number,
    context: OutlineParserContext
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
