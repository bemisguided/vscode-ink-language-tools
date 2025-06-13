import * as vscode from "vscode";
import { OutlineParserContext } from "./OutlineParserContext";

export interface OutlineSymbolParser {
  tryParse(
    line: string,
    lineNumber: number,
    context: OutlineParserContext
  ): vscode.DocumentSymbol | null;
}
