import * as vscode from "vscode";
import { EntityParser } from "./EntityParser";
import { OutlineParserContext } from "./OutlineParserContext";
import { OutlineEntity, SymbolType } from "../model/OutlineEntity";

export class StitchParser implements EntityParser {
  private regex = /^=\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:\((.*?)\))?\s*$/;

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
      SymbolType.stitch,
      lineNumber,
      range,
      range
    );
    if (context.currentKnot) {
      context.currentKnot.addChild(entity);
      return null;
    }
    return entity;
  }
}
