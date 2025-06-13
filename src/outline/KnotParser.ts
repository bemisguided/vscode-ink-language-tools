import * as vscode from "vscode";
import { OutlineSymbolParser } from "./OutlineSymbolParser";
import { OutlineParserContext } from "./OutlineParserContext";
import { OutlineEntity, SymbolType } from "../dependencies/OutlineEntity";

export class KnotParser implements OutlineSymbolParser {
  private regex = /^===\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:\((.*?)\))?\s*===\s*$/;

  tryParse(
    line: string,
    lineNumber: number,
    context: OutlineParserContext
  ): OutlineEntity | null {
    const match = this.regex.exec(line.trim());
    if (!match) {
      return null;
    }
    const [_, name, params] = match;
    const range = new vscode.Range(lineNumber, 0, lineNumber, line.length);
    const entity = new OutlineEntity(
      name + (params ? `(${params})` : ""),
      SymbolType.knot,
      lineNumber,
      range,
      range
    );
    context.currentKnot = entity;
    return entity;
  }
}
