import * as vscode from "vscode";
import { PipelineProcessor } from "./PipelineProcessor";
import { PipelineContext } from "./PipelineContext";
import { Compiler, CompilerOptions } from "inkjs/compiler/Compiler";
import { PipelineFileHandler } from "./PipelineFileHandler";
import { ErrorType as InkjsErrorType } from "inkjs/engine/Error";

export class CompilationProcessor implements PipelineProcessor {
  async run(ctx: PipelineContext): Promise<void> {
    // const node = ctx.graph.get(ctx.currentUri);
    // if (node?.type !== "story") {
    //   return;
    // }
    const text = await ctx.getText();
    try {
      const fileHandler = new PipelineFileHandler(ctx);
      const compilerOptions: CompilerOptions = {
        sourceFilename: ctx.currentUri.fsPath,
        fileHandler,
        pluginNames: [],
        countAllVisits: false,
        errorHandler: (message: string, type: InkjsErrorType) => {
          const { message: msg, line, column } = this.parseError(message);
          const severity =
            type === InkjsErrorType.Warning
              ? vscode.DiagnosticSeverity.Warning
              : vscode.DiagnosticSeverity.Error;
          const all = text.split(/\r?\n/);
          const lineText = all[line] || "";
          const range = new vscode.Range(
            new vscode.Position(line, 0),
            new vscode.Position(line, lineText.length)
          );
          ctx.report(range, msg, severity);
        },
      };
      const compiler = new Compiler(text, compilerOptions);
      ctx.compiledStory = compiler.Compile();
    } catch (err: any) {
      console.log("err", err);
    }
  }

  private parseError(errorText: string) {
    let line = 0;
    let column = 0;
    let message = errorText;

    // Parse line number from various patterns
    const lineMatch = errorText.match(/line (\d+)/i);
    if (lineMatch) {
      line = parseInt(lineMatch[1], 10) - 1; // Convert to 0-based
    }

    // Parse column number if present
    const columnMatch = errorText.match(/column (\d+)/i);
    if (columnMatch) {
      column = parseInt(columnMatch[1], 10) - 1; // Convert to 0-based
    }

    // Extract message after the first colon following the line number
    // Example: WARNING: '/path/file.ink' line 20: Message here
    const msgMatch = errorText.match(/line \d+:\s*(.*)$/i);
    if (msgMatch) {
      message = msgMatch[1];
    }

    return { message, line, column };
  }
}
