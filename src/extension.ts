import * as vscode from "vscode";
import { InkCompiler } from "./compiler/InkCompiler";
import { DocumentWatcher } from "./compiler/DocumentWatcher";

let inkCompiler: InkCompiler;
let documentWatcher: DocumentWatcher;

export function activate(context: vscode.ExtensionContext) {
  console.log("Ink Language Support extension is now active!");

  // Initialize the compilation system
  inkCompiler = new InkCompiler();
  documentWatcher = new DocumentWatcher(inkCompiler);

  // Register for cleanup
  context.subscriptions.push(
    { dispose: () => inkCompiler.dispose() },
    { dispose: () => documentWatcher.dispose() }
  );

  // Register commands for testing
  context.subscriptions.push(
    vscode.commands.registerCommand("ink.compileFile", async () => {
      const activeEditor = vscode.window.activeTextEditor;
      if (activeEditor && activeEditor.document.languageId === "ink") {
        const filePath = activeEditor.document.uri.fsPath;

        try {
          const result = await inkCompiler.compileFile(filePath);
          const report = inkCompiler.getCompilationReport(result);

          if (result.success) {
            vscode.window.showInformationMessage(report);
          } else {
            // Show detailed error report in output channel
            const outputChannel =
              vscode.window.createOutputChannel("Ink Compilation");
            outputChannel.clear();
            outputChannel.appendLine(report);
            outputChannel.show();

            vscode.window.showErrorMessage(
              `Ink compilation failed with ${result.errors.length} error(s). See output for details.`
            );
          }
        } catch (error) {
          vscode.window.showErrorMessage(
            `Ink compilation error: ${
              error instanceof Error ? error.message : String(error)
            }`
          );
        }
      } else {
        vscode.window.showWarningMessage("Please open an Ink file to compile.");
      }
    }),

    vscode.commands.registerCommand("ink.debugCompile", async () => {
      const activeEditor = vscode.window.activeTextEditor;
      if (activeEditor && activeEditor.document.languageId === "ink") {
        const filePath = activeEditor.document.uri.fsPath;

        console.log("🔍 Debug compile triggered for:", filePath);

        try {
          const result = await inkCompiler.compileFile(filePath);
          console.log("🔍 Debug compile result:", {
            success: result.success,
            errorsCount: result.errors.length,
            warningsCount: result.warnings.length,
            errors: result.errors,
          });

          const report = inkCompiler.getCompilationReport(result);

          // Always show output channel for debugging
          const outputChannel = vscode.window.createOutputChannel("Ink Debug");
          outputChannel.clear();
          outputChannel.appendLine("=== DEBUG COMPILATION RESULT ===");
          outputChannel.appendLine(report);
          outputChannel.appendLine("\n=== RAW ERROR DATA ===");
          outputChannel.appendLine(JSON.stringify(result.errors, null, 2));
          outputChannel.show();

          vscode.window.showInformationMessage(
            "Debug compilation complete. Check output channel for details."
          );
        } catch (error) {
          console.error("🔍 Debug compile error:", error);
          vscode.window.showErrorMessage(
            `Debug compilation error: ${
              error instanceof Error ? error.message : String(error)
            }`
          );
        }
      } else {
        vscode.window.showWarningMessage(
          "Please open an Ink file to debug compile."
        );
      }
    })
  );

  console.log("✓ Ink compilation system initialized");
}

export function deactivate() {
  console.log("Ink Language Support extension is now deactivated!");

  // Cleanup is handled by context.subscriptions
}
