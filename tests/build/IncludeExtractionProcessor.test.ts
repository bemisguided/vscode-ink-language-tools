import * as vscode from "vscode";
import { IncludeExtractionProcessor } from "../../src/build/IncludeExtractionProcessor";
import { PipelineContext } from "../../src/build/PipelineContext";
import { OutlineManager } from "../../src/model/OutlineManager";
import { OutlineEntity, SymbolType } from "../../src/model/OutlineEntity";
import { MockVSCodeDocumentService } from "../../src/utils/MockVSCodeDocumentService";

jest.mock("vscode", () => require("jest-mock-vscode").createVSCodeMock(jest));

// Helper to create a mock OutlineEntity for an include
function createIncludeEntity(name: string, line = 0): OutlineEntity {
  return new OutlineEntity(
    name,
    SymbolType.include,
    line,
    new vscode.Range(line, 0, line, name.length),
    new vscode.Range(line, 0, line, name.length)
  );
}

describe("IncludeExtractionProcessor", () => {
  let outlineManager: OutlineManager;
  let processor: IncludeExtractionProcessor;
  let ctx: PipelineContext;
  let diagnosticCollection: vscode.DiagnosticCollection;
  let mockDocService: MockVSCodeDocumentService;

  beforeEach(() => {
    outlineManager = OutlineManager.getInstance();
    outlineManager.clear();
    mockDocService = new MockVSCodeDocumentService();
    processor = new IncludeExtractionProcessor(mockDocService);
    diagnosticCollection = {
      set: jest.fn(),
      clear: jest.fn(),
      delete: jest.fn(),
      forEach: jest.fn(),
      name: "test",
    } as any;
    ctx = new PipelineContext(
      vscode.Uri.file("/root.ink"),
      diagnosticCollection
    );
  });

  it("loads a single include", async () => {
    // Setup
    outlineManager.setOutline(ctx.currentUri, [createIncludeEntity("a.ink")]);
    outlineManager.setOutline(vscode.Uri.file("/a.ink"), []);
    mockDocService.mockTextDocument(ctx.currentUri);
    mockDocService.mockTextDocument(vscode.Uri.file("/a.ink"));

    // Execute
    await processor.run(ctx);

    // Assert
    expect(ctx.includeDocuments.has("a.ink")).toBe(true);
    expect(ctx.diagnostics.length).toBe(0);
  });

  it("loads nested includes", async () => {
    // Setup
    outlineManager.setOutline(ctx.currentUri, [createIncludeEntity("a.ink")]);
    outlineManager.setOutline(vscode.Uri.file("/a.ink"), [
      createIncludeEntity("b.ink"),
    ]);
    outlineManager.setOutline(vscode.Uri.file("/b.ink"), []);
    mockDocService.mockTextDocument(ctx.currentUri);
    mockDocService.mockTextDocument(vscode.Uri.file("/a.ink"));
    mockDocService.mockTextDocument(vscode.Uri.file("/b.ink"));

    // Execute
    await processor.run(ctx);

    // Assert
    expect(ctx.includeDocuments.has("b.ink")).toBe(true);
  });

  it("reports missing include as diagnostic", async () => {
    // Setup
    outlineManager.setOutline(ctx.currentUri, [
      createIncludeEntity("missing.ink"),
    ]);
    mockDocService.mockTextDocument(ctx.currentUri);
    // Do not add missing.ink to simulate missing file

    // Execute
    await processor.run(ctx);

    // Assert
    expect(ctx.diagnostics.length).toBeGreaterThan(0);
    expect(ctx.includeDocuments.has("missing.ink")).toBe(false);
  });

  it("handles cyclic includes without infinite loop", async () => {
    // Setup
    outlineManager.setOutline(ctx.currentUri, [createIncludeEntity("a.ink")]);
    outlineManager.setOutline(vscode.Uri.file("/a.ink"), [
      createIncludeEntity("root.ink"),
    ]);
    mockDocService.mockTextDocument(ctx.currentUri);
    mockDocService.mockTextDocument(vscode.Uri.file("/a.ink"));

    // Execute
    await processor.run(ctx);

    // Assert
    expect(ctx.includeDocuments.has("a.ink")).toBe(true);
    // Should not throw or hang
  });

  // Add more tests for edge cases as needed

  afterEach(() => {
    jest.restoreAllMocks();
  });
});
