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
import { IncludePreProcessor } from "../../src/build/IncludePreProcessor";
import { PipelineContext } from "../../src/build/PipelineContext";
import { OutlineManager } from "../../src/model/OutlineManager";
import { VSCodeServiceLocator } from "../../src/services/VSCodeServiceLocator";
import { MockVSCodeDocumentService } from "../__mocks__/MockVSCodeDocumentService";
import { mockVSCodeDocument } from "../__mocks__/mockVSCodeDocument";
import { OutlineEntity, EntityType } from "../../src/model/OutlineEntity";
import { DependencyManager } from "../../src/model/DependencyManager";
import { mockVSCodeUri } from "../__mocks__/mockVSCodeUri";

describe("IncludePreProcessor", () => {
  let processor: IncludePreProcessor;
  let context: PipelineContext;
  let rootUri: vscode.Uri;
  let mockDocService: MockVSCodeDocumentService;
  let depManager: DependencyManager;
  let outlineManager: OutlineManager;

  function createIncludeEntity(uri: vscode.Uri, name: string): OutlineEntity {
    const outlineManager = OutlineManager.getInstance();
    const entity = new OutlineEntity(
      name,
      EntityType.include,
      new vscode.Range(0, 0, 0, 0),
      new vscode.Range(0, 0, 0, 0),
      false
    );
    outlineManager.setOutline(uri, [entity]);
    return entity;
  }

  beforeEach(() => {
    // Setup Dependency Manager
    depManager = DependencyManager.getInstance();
    depManager.clear();

    // Setup Outline Manager
    outlineManager = OutlineManager.getInstance();
    outlineManager.clear();

    // Setup Document Service
    mockDocService = new MockVSCodeDocumentService();
    VSCodeServiceLocator.setDocumentService(mockDocService);

    // Setup Processor
    processor = new IncludePreProcessor(mockDocService);

    // Setup Context
    rootUri = mockVSCodeUri("/root.ink");
    context = new PipelineContext(rootUri, mockVSCodeDocument(rootUri, ""));
  });

  it("loads a single include", async () => {
    // Setup
    const includeUri = mockVSCodeUri("/a.ink");
    createIncludeEntity(rootUri, "a.ink");
    mockDocService.mockTextDocument(includeUri, "Hello, world!");

    // Execute
    await processor.run(context);

    // Assert
    expect(context.includeDocuments.has("a.ink")).toBe(true);
    expect(context.getDiagnostics().length).toBe(0);
  });

  it("loads nested includes", async () => {
    // Setup
    const includeUri = mockVSCodeUri("/a.ink");
    createIncludeEntity(rootUri, "a.ink");
    createIncludeEntity(includeUri, "b.ink");
    mockDocService.mockTextDocument(includeUri, "INCLUDE b.ink");
    mockDocService.mockTextDocument(mockVSCodeUri("/b.ink"), "Hello, world!");

    // Execute
    await processor.run(context);

    // Assert
    expect(context.includeDocuments.has("a.ink")).toBe(true);
    expect(context.includeDocuments.has("b.ink")).toBe(true);
    expect(context.getDiagnostics().length).toBe(0);
  });

  it("missing includes are not added to includeDocuments", async () => {
    // Setup
    createIncludeEntity(rootUri, "missing.ink");

    // Execute
    await processor.run(context);

    // Assert
    expect(context.includeDocuments.has("missing.ink")).toBe(false);
    expect(context.getDiagnostics().length).toBe(0);
  });

  it("updates the depedendcy graph with new includes", async () => {
    // Setup
    depManager.createNode(rootUri);
    createIncludeEntity(rootUri, "a.ink");
    const includeUri = mockVSCodeUri("/a.ink");
    mockDocService.mockTextDocument(includeUri, "Hello, world!");

    // Execute
    await processor.run(context);
    depManager.updateDependencies(context.getDependencies());

    // Assert
    expect(depManager.hasNode(rootUri)).toBeTruthy();
    expect(depManager.hasNode(includeUri)).toBeTruthy();
    expect(depManager.hasDependency(rootUri, includeUri)).toBeTruthy();
  });

  it("handles cyclic includes without infinite loop", async () => {
    // Setup
    const rootInclude = new OutlineEntity(
      "a.ink",
      EntityType.include,
      new vscode.Range(0, 0, 0, 15),
      new vscode.Range(0, 0, 0, 15),
      false
    );
    const cyclicInclude = new OutlineEntity(
      "root.ink",
      EntityType.include,
      new vscode.Range(0, 0, 0, 16),
      new vscode.Range(0, 0, 0, 16),
      false
    );
    outlineManager.setOutline(context.uri, [rootInclude]);
    outlineManager.setOutline(mockVSCodeUri("/a.ink"), [cyclicInclude]);
    mockDocService.mockTextDocument(mockVSCodeUri("/a.ink"), ""); // a.ink must exist

    // Execute
    await processor.run(context);

    // Assert
    expect(context.includeDocuments.has("a.ink")).toBe(true);
    // Should not throw or hang
  });
});
