import * as vscode from "vscode";

export class OutlineParserContext {
  public currentKnot: vscode.DocumentSymbol | null = null;
  public currentList: vscode.DocumentSymbol | null = null;
}
