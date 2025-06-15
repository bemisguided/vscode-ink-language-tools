import * as vscode from "vscode";
import { PipelineProcessor } from "../PipelineProcessor";
import { PipelineContext } from "../PipelineContext";
import { Compiler, CompilerOptions } from "inkjs/compiler/Compiler";
import { VSCodeFileHandler } from "./VSCodeFileHandler";
import { ErrorType as InkjsErrorType } from "inkjs/engine/Error";
import { parseCompilationError } from "./parseCompilationError";

export class CompilationProcessor implements PipelineProcessor {
  async run(ctx: PipelineContext): Promise<void> {
    // const node = ctx.graph.get(ctx.currentUri);
    // if (node?.type !== "story") {
    //   return;
    // }
    const text = await ctx.getText();
    try {
      const fileHandler = new VSCodeFileHandler(ctx);
      const compilerOptions: CompilerOptions = {
        sourceFilename: ctx.currentUri.fsPath,
        fileHandler,
        pluginNames: [],
        countAllVisits: false,
        errorHandler: (message: string, type: InkjsErrorType) => {
          const { message: msg, line } = parseCompilationError(message);
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
}
