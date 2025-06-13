import * as vscode from "vscode";
import { PipelineProcessor } from "./PipelineProcessor";
import { PipelineContext } from "./PipelineContext";

export class MockExtractionProcessor implements PipelineProcessor {
  private static readonly MOCK_REGEX = /^\s*\/\/\s*MOCKS?\s+(.+\.js)$/gm;

  async run(ctx: PipelineContext): Promise<void> {
    const text = await ctx.getText();
    let match: RegExpExecArray | null;
    while ((match = MockExtractionProcessor.MOCK_REGEX.exec(text)) !== null) {
      const path = match[1].trim();
      const prior = text.slice(0, match.index);
      const line = prior.split(/\r?\n/).length - 1;
      const startChar = match.index + match[0].indexOf(path);
      const endChar = startChar + path.length;
      const range = new vscode.Range(
        new vscode.Position(line, startChar),
        new vscode.Position(line, endChar)
      );
      const target = vscode.Uri.joinPath(ctx.currentUri, "..", path);
      try {
        await vscode.workspace.fs.stat(target);
        ctx.addDep(target);
      } catch {
        ctx.report(
          range,
          `Mock file not found: ${path}`,
          vscode.DiagnosticSeverity.Warning
        );
      }
    }
  }
}
