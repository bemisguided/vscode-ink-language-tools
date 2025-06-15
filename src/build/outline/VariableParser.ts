import * as vscode from "vscode";
import { EntityParser } from "./EntityParser";
import { OutlineParserContext } from "./OutlineParserContext";
import { OutlineEntity, SymbolType } from "../../model/OutlineEntity";

export class VariableParser implements EntityParser {
  private regex = /^VAR\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=/;

  tryParse(
    line: string,
    lineNumber: number,
    context: OutlineParserContext
  ): OutlineEntity | null {
    const match = this.regex.exec(line.trim());
    if (!match) {
      return null;
    }
    const [_, name] = match;
    const range = new vscode.Range(lineNumber, 0, lineNumber, line.length);
    return new OutlineEntity(
      name,
      SymbolType.variable,
      lineNumber,
      range,
      range
    );
  }
}
