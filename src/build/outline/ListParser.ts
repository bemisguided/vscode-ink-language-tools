import * as vscode from "vscode";
import { EntityParser } from "./EntityParser";
import { OutlineParserContext } from "./OutlineParserContext";
import { OutlineEntity, SymbolType } from "../../model/OutlineEntity";

export class ListParser implements EntityParser {
  private regex = /^LIST\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*(?:=\s*(.*))?$/;

  tryParse(
    line: string,
    lineNumber: number,
    context: OutlineParserContext
  ): OutlineEntity | null {
    const match = this.regex.exec(line.trim());
    if (!match) {
      return null;
    }
    const [_, listName, inlineItems] = match;
    const range = new vscode.Range(lineNumber, 0, lineNumber, line.length);
    const listEntity = new OutlineEntity(
      listName,
      SymbolType.list,
      lineNumber,
      range,
      range
    );
    if (inlineItems) {
      const items = inlineItems
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      for (const item of items) {
        const itemEntity = new OutlineEntity(
          item,
          SymbolType.listItem,
          lineNumber,
          range,
          range
        );
        listEntity.addChild(itemEntity);
      }
    }
    return listEntity;
  }
}
