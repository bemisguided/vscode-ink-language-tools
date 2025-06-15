import * as vscode from "vscode";
import { PipelineProcessor } from "./PipelineProcessor";
import { PipelineContext } from "./PipelineContext";
import { OutlineManager } from "../model/OutlineManager";
import { SymbolType } from "../model/OutlineEntity";
import {
  VSCodeDocumentService,
  VSCodeDocumentServiceImpl,
} from "../utils/VSCodeDocumentService";

export class IncludeExtractionProcessor implements PipelineProcessor {
  private docService: VSCodeDocumentService;

  constructor(
    docService: VSCodeDocumentService = new VSCodeDocumentServiceImpl()
  ) {
    this.docService = docService;
  }

  async run(ctx: PipelineContext): Promise<void> {
    const outlineManager = OutlineManager.getInstance();
    const visited = new Set<string>();
    const baseUri = ctx.currentUri;

    const loadIncludes = async (uri: vscode.Uri) => {
      if (visited.has(uri.toString())) {
        return;
      }
      visited.add(uri.toString());
      let doc: vscode.TextDocument;
      try {
        doc = await this.docService.getTextDocument(uri);
      } catch (err) {
        // If the root document can't be loaded, report and stop
        if (uri.toString() === baseUri.toString()) {
          ctx.report(
            new vscode.Range(0, 0, 0, 1),
            `Failed to open root document: ${uri.fsPath}`,
            vscode.DiagnosticSeverity.Error
          );
        }
        return;
      }
      // Get all include entities for this document
      const includes = outlineManager.queryByTypes(uri, SymbolType.include);
      for (const includeEntity of includes) {
        const includePath = includeEntity.name;
        const resolvedUri = this.docService.resolvePath(uri, includePath);
        if (!resolvedUri) {
          ctx.report(
            includeEntity.definitionRange,
            `Could not resolve include path: ${includePath}`,
            vscode.DiagnosticSeverity.Error
          );
          continue;
        }
        try {
          const includeDoc = await this.docService.getTextDocument(
            uri,
            includePath
          );
          ctx.includeDocuments.set(includePath, includeDoc);
          await loadIncludes(resolvedUri);
        } catch {
          ctx.report(
            includeEntity.definitionRange,
            `Included file not found: ${includePath}`,
            vscode.DiagnosticSeverity.Error
          );
        }
      }
    };

    await loadIncludes(baseUri);
  }
}
