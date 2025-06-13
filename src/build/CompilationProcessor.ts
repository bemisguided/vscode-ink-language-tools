import * as vscode from "vscode";
import { PipelineProcessor } from "./PipelineProcessor";
import { PipelineContext } from "./PipelineContext";
import { Compiler } from "inkjs";

export class CompilationProcessor implements PipelineProcessor {
  async run(ctx: PipelineContext): Promise<void> {
    const node = ctx.graph.get(ctx.currentUri);
    if (node?.type !== "story") {
      return;
    }
    const text = await ctx.getText();
    try {
      const compiler = new Compiler(text);
      ctx.compiledStory = compiler.Compile();
    } catch (err: any) {
      const lines = (err.message as string).split("\n");
      for (const msg of lines) {
        const match = msg.match(/\((\d+)\)/);
        const lineNum = match ? Math.max(0, parseInt(match[1], 10) - 1) : 0;
        const all = text.split(/\r?\n/);
        const lineText = all[lineNum] || "";
        const range = new vscode.Range(
          new vscode.Position(lineNum, 0),
          new vscode.Position(lineNum, lineText.length)
        );
        ctx.report(range, msg, vscode.DiagnosticSeverity.Error);
      }
    }
  }
}
