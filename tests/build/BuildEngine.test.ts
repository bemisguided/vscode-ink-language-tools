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
import { BuildEngine } from "../../src/build/BuildEngine";
import { VSCodeServiceLocator } from "../../src/services/VSCodeServiceLocator";
import { MockVSCodeDiagnosticsService } from "../__mocks__/MockVSCodeDiagnosticsService";
import { MockVSCodeDocumentService } from "../__mocks__/MockVSCodeDocumentService";
import { DependencyManager } from "../../src/model/DependencyManager";
import {
  DependencyNode,
  DependencyNodeType,
} from "../../src/model/DependencyNode";

describe("BuildEngine", () => {
  let diagnosticsService: MockVSCodeDiagnosticsService;
  let docService: MockVSCodeDocumentService;
  let engine: BuildEngine;

  beforeEach(() => {
    diagnosticsService = new MockVSCodeDiagnosticsService();
    docService = new MockVSCodeDocumentService();
    VSCodeServiceLocator.setDiagnosticsService(diagnosticsService);
    VSCodeServiceLocator.setDocumentService(docService);
    engine = BuildEngine.getInstance();
    DependencyManager.getInstance().clearGraph();
  });

  afterEach(() => {
    DependencyManager.getInstance().clearGraph();
  });

  it("throws if URI is not in dependency graph", async () => {
    // Setup
    const uri = vscode.Uri.file("/not-in-graph.ink");

    // Execute & Assert
    await expect(engine.compileStory(uri)).rejects.toThrow(/URI not in graph/);
  });

  it("compiles a story and sets diagnostics", async () => {
    // Setup
    const uri = vscode.Uri.file("/story.ink");
    DependencyManager.getInstance().setNode(
      uri,
      DependencyNode.fromUri(uri, 0)
    );
    docService.mockTextDocument(uri);

    // Execute & Assert
    await expect(engine.compileStory(uri)).resolves.toBeDefined();
    expect(diagnosticsService.mockDiagnosticsForUri(uri)).toBeDefined();
  });

  it("recompiles dependents and sets diagnostics", async () => {
    // Setup
    const uri = vscode.Uri.file("/root.ink");
    const depUri = vscode.Uri.file("/dep.ink");
    const rootNode = DependencyNode.fromUri(uri, 0);
    const depNode = DependencyNode.fromUri(depUri, 0);
    rootNode.deps.add(depUri);
    depNode.revDeps.add(uri);
    DependencyManager.getInstance().setNode(uri, rootNode);
    DependencyManager.getInstance().setNode(depUri, depNode);
    docService.mockTextDocument(uri);
    docService.mockTextDocument(depUri);

    // Execute
    const result = await engine.recompileDependents(depUri);

    // Assert
    expect(result.size).toBeGreaterThan(0);
    expect(diagnosticsService.mockDiagnosticsForUri(uri)).toBeDefined();
  });

  // it("returns externals in compileStory", async () => {
  //   // Setup
  //   const uri = vscode.Uri.file("/story.ink");
  //   const extUri = vscode.Uri.file("/external.js");
  //   const node = DependencyNode.fromUri(uri, 0);
  //   node.deps.add(extUri);
  //   DependencyManager.getInstance().setNode(uri, node);
  //   const extNode = DependencyNode.fromUri(extUri, 0);
  //   extNode.type = DependencyNodeType.externalFunctions;
  //   DependencyManager.getInstance().setNode(extUri, extNode);
  //   docService.mockTextDocument(uri);
  //   docService.mockTextDocument(extUri);

  //   // Execute
  //   const result = await engine.compileStory(uri);

  //   // Assert
  //   expect(result.externals.map((u) => u.toString())).toContain(
  //     extUri.toString()
  //   );
  // });
});
