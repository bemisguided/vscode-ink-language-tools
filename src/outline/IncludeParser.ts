import * as vscode from "vscode";
import { OutlineSymbolParser } from "./OutlineSymbolParser";
import { OutlineParserContext } from "./OutlineParserContext";
import { OutlineEntity, SymbolType } from "../dependencies/OutlineEntity";

export class IncludeParser implements OutlineSymbolParser {
  private regex = /^INCLUDE\s+(.+\.ink)\s*$/;

  tryParse(
    line: string,
    lineNumber: number,
    context: OutlineParserContext
  ): OutlineEntity | null {
    const match = this.regex.exec(line.trim());
    if (!match) {
      return null;
    }
    const [_, path] = match;
    const range = new vscode.Range(lineNumber, 0, lineNumber, line.length);
    return new OutlineEntity(
      path,
      SymbolType.include,
      lineNumber,
      range,
      range
    );
  }
}
