import * as vscode from "vscode";
import { InkCompiler } from "./compiler/InkCompiler";
import { DocumentWatcher } from "./compiler/DocumentWatcher";
import { InkPreviewPanel } from "./InkPreviewPanel";

let inkCompiler: InkCompiler;
let documentWatcher: DocumentWatcher;

export function activate(context: vscode.ExtensionContext) {
  console.log("🔧 Ink Language Support extension is now active!");

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
      await compileCurrentFile();
    }),

    vscode.commands.registerCommand("ink.debugCompile", async () => {
      await compileCurrentFile(true);
    }),

    vscode.commands.registerCommand("ink.openPreview", async () => {
      InkPreviewPanel.createOrShow(context.extensionUri);
      // Automatically compile and load the current file into the preview with debug mode
      await compileCurrentFile(true);
    })
  );

  // Register automatic compilation on save
  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument(async (document) => {
      if (document.languageId === "ink") {
        // Always compile with debug mode if preview panel is open
        const debugMode = !!InkPreviewPanel.currentPanel;
        await compileCurrentFile(debugMode);
      }
    })
  );

  // Register automatic sync when switching between Ink files
  let lastCompiledFile: string | null = null;

  context.subscriptions.push(
    vscode.window.onDidChangeActiveTextEditor(async (editor) => {
      // Only sync if preview panel is open and the new file is an Ink file
      if (
        InkPreviewPanel.currentPanel &&
        editor?.document.languageId === "ink"
      ) {
        const currentFile = editor.document.fileName;

        // Don't recompile if it's the same file as last time
        if (lastCompiledFile === currentFile) {
          console.log(
            "📋 Active editor changed but same file - skipping recompilation"
          );
          return;
        }

        console.log(
          "📋 Active editor changed to different Ink file - syncing preview"
        );
        lastCompiledFile = currentFile;
        await compileCurrentFile(true);
      }
    })
  );

  // Register webview panel serializer for revival
  if (vscode.window.registerWebviewPanelSerializer) {
    vscode.window.registerWebviewPanelSerializer("inkPreview", {
      async deserializeWebviewPanel(
        webviewPanel: vscode.WebviewPanel,
        state: any
      ) {
        InkPreviewPanel.revive(webviewPanel, context.extensionUri);
      },
    });
  }

  console.log("✓ Ink compilation system initialized");
}

async function compileCurrentFile(debug: boolean = false): Promise<void> {
  const activeEditor = vscode.window.activeTextEditor;

  if (!activeEditor) {
    vscode.window.showWarningMessage("No active Ink file to compile");
    return;
  }

  if (activeEditor.document.languageId !== "ink") {
    vscode.window.showWarningMessage("Current file is not an Ink file");
    return;
  }

  const filePath = activeEditor.document.fileName;

  try {
    const result = await inkCompiler.compileFile(filePath, debug);

    if (result.success) {
      if (debug) {
        console.log("✅ Debug compilation successful");
        console.log("Compilation details:", result);
      }

      // Update preview panel if it exists and we have JSON output
      if (InkPreviewPanel.currentPanel) {
        if (result.jsonOutput) {
          console.log("📖 Loading story into preview panel");
          InkPreviewPanel.currentPanel.loadStory(result.jsonOutput, filePath);
        } else {
          console.log("⚠️ No JSON output available for preview");
          // Show error in preview panel
          InkPreviewPanel.currentPanel.loadStory(
            '{"error": "No story content generated"}',
            filePath
          );
        }
      } else {
        console.log("ℹ️ No preview panel open - compilation complete");
      }
    } else {
      console.log(`❌ Found ${result.errors.length} compilation error(s)`);
    }
  } catch (error) {
    vscode.window.showErrorMessage(`Compilation failed: ${error}`);
    console.error("Compilation error:", error);
  }
}

export function deactivate() {
  console.log("Ink Language Support extension is now deactivated!");

  // Cleanup is handled by context.subscriptions
}
