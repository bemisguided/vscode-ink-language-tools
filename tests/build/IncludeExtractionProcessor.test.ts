/**
 * MIT License
 *
 * Copyright (c) 2025 Martin Crawford
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import * as vscode from "vscode";
import { IncludeExtractionProcessor } from "../../src/build/IncludeExtractionProcessor";
import { PipelineContext } from "../../src/build/PipelineContext";
import { OutlineManager } from "../../src/model/OutlineManager";
import { OutlineEntity, SymbolType } from "../../src/model/OutlineEntity";
import { VSCodeServiceLocator } from "../../src/services/VSCodeServiceLocator";
import { MockVSCodeDocumentService } from "../__mocks__/MockVSCodeDocumentService";
import { MockVSCodeDiagnosticsService } from "../__mocks__/MockVSCodeDiagnosticsService";

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
  let context: PipelineContext;
  let mockDocService: MockVSCodeDocumentService;
  let mockDiagnosticsService: MockVSCodeDiagnosticsService;

  beforeEach(() => {
    outlineManager = OutlineManager.getInstance();
    outlineManager.clear();
    mockDocService = new MockVSCodeDocumentService();
    mockDiagnosticsService = new MockVSCodeDiagnosticsService();
    VSCodeServiceLocator.setDocumentService(mockDocService);
    processor = new IncludeExtractionProcessor(mockDocService);
    context = new PipelineContext(
      vscode.Uri.file("/root.ink"),
      mockDiagnosticsService,
      mockDocService
    );
  });

  it("loads a single include", async () => {
    // Setup
    outlineManager.setOutline(context.currentUri, [
      createIncludeEntity("a.ink"),
    ]);
    outlineManager.setOutline(vscode.Uri.file("/a.ink"), []);
    mockDocService.mockTextDocument(context.currentUri);
    mockDocService.mockTextDocument(vscode.Uri.file("/a.ink"));

    // Execute
    await processor.run(context);

    // Assert
    expect(context.includeDocuments.has("a.ink")).toBe(true);
    expect(context.diagnostics.length).toBe(0);
  });

  it("loads nested includes", async () => {
    // Setup
    outlineManager.setOutline(context.currentUri, [
      createIncludeEntity("a.ink"),
    ]);
    outlineManager.setOutline(vscode.Uri.file("/a.ink"), [
      createIncludeEntity("b.ink"),
    ]);
    outlineManager.setOutline(vscode.Uri.file("/b.ink"), []);
    mockDocService.mockTextDocument(context.currentUri);
    mockDocService.mockTextDocument(vscode.Uri.file("/a.ink"));
    mockDocService.mockTextDocument(vscode.Uri.file("/b.ink"));

    // Execute
    await processor.run(context);

    // Assert
    expect(context.includeDocuments.has("b.ink")).toBe(true);
  });

  it("reports missing include as diagnostic", async () => {
    // Setup
    outlineManager.setOutline(context.currentUri, [
      createIncludeEntity("missing.ink"),
    ]);
    mockDocService.mockTextDocument(context.currentUri);
    // Do not add missing.ink to simulate missing file

    // Execute
    await processor.run(context);

    // Assert
    expect(context.diagnostics.length).toBeGreaterThan(0);
    expect(context.includeDocuments.has("missing.ink")).toBe(false);
  });

  it("handles cyclic includes without infinite loop", async () => {
    // Setup
    outlineManager.setOutline(context.currentUri, [
      createIncludeEntity("a.ink"),
    ]);
    outlineManager.setOutline(vscode.Uri.file("/a.ink"), [
      createIncludeEntity("root.ink"),
    ]);
    mockDocService.mockTextDocument(context.currentUri);
    mockDocService.mockTextDocument(vscode.Uri.file("/a.ink"));

    // Execute
    await processor.run(context);

    // Assert
    expect(context.includeDocuments.has("a.ink")).toBe(true);
    // Should not throw or hang
  });

  // Add more tests for edge cases as needed

  afterEach(() => {
    jest.restoreAllMocks();
  });
});
