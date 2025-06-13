import * as vscode from "vscode";
import { Story } from "inkjs";

export interface CompiledStoryResult {
  story: Story;
  externals: vscode.Uri[];
}
