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
import { MockVSCodeConfigurationService } from "../__mocks__/MockVSCodeConfigurationService";
import { OutlineManager } from "../../src/model/OutlineManager";
import { ISuccessfulBuildResult } from "../../src/build/IBuildResult";
import { mockVSCodeUri } from "../__mocks__/mockVSCodeUri";
import { OutlineParser } from "../../src/build/OutlineParser";

describe("BuildEngine", () => {
  let depManager: DependencyManager;
  let outlineManager: OutlineManager;
  let diagnosticsService: MockVSCodeDiagnosticsService;
  let docService: MockVSCodeDocumentService;
  let configService: MockVSCodeConfigurationService;
  let engine: BuildEngine;

  beforeEach(() => {
    // Reset Singletons
    BuildEngine.clearInstance();
    OutlineParser.clearInstance();

    // Setup Dependency Manager
    depManager = DependencyManager.getInstance();
    depManager.clear();

    // Setup Outline Manager
    outlineManager = OutlineManager.getInstance();
    outlineManager.clear();

    // Setup Services & Mock Services
    diagnosticsService = new MockVSCodeDiagnosticsService();
    docService = new MockVSCodeDocumentService();
    configService = new MockVSCodeConfigurationService();
    VSCodeServiceLocator.setDiagnosticsService(diagnosticsService);
    VSCodeServiceLocator.setDocumentService(docService);
    VSCodeServiceLocator.setConfigurationService(configService);

    // Setup Build Engine
    engine = BuildEngine.getInstance();
  });

  describe("compileStory()", () => {
    let uri: vscode.Uri;

    beforeEach(() => {
      uri = mockVSCodeUri("/story.ink");
      docService.mockTextDocument(uri, "Hello, world!");
    });

    it("compiles a story without errors", async () => {
      // Execute
      const result = await engine.compileStory(uri);

      // Assert
      expect(result.uri).toEqual(uri);
      expect(result.success).toBe(true);
      const successfulResult = result as ISuccessfulBuildResult;
      expect(successfulResult.story).toBeDefined();
    });

    it("adds the story to the dependency graph", async () => {
      // Execute
      await engine.compileStory(uri);

      // Assert
      expect(depManager.hasNode(uri)).toBeTruthy();
    });

    it("creates a diagnostics entry for the story", async () => {
      // Execute
      await engine.compileStory(uri);

      // Assert
      expect(diagnosticsService.get(uri)).toBeDefined();
    });

    describe("when the story has errors", () => {
      beforeEach(() => {
        docService.mockTextDocument(uri, "Hello, world! {");
      });

      it("returns a failed build result", async () => {
        // Execute
        const result = await engine.compileStory(uri);

        // Assert
        expect(result.uri).toEqual(uri);
        expect(result.success).toBeFalsy();
      });

      it("returns the diagnostics", async () => {
        // Execute
        const result = await engine.compileStory(uri);

        // Assert
        expect(result.diagnostics).toHaveLength(2);
        expect(result.diagnostics[0].message).toContain("Expected some kind");
        expect(result.diagnostics[1].message).toContain("Expected end of line");
      });
    });

    describe("when the story has included stories", () => {
      let includedUri: vscode.Uri;

      beforeEach(() => {
        docService.mockTextDocument(uri, "INCLUDE /included.ink");
        includedUri = mockVSCodeUri("/included.ink");
        docService.mockTextDocument(includedUri, "Hello, world!");
      });

      it("adds the included stories to the dependency graph", async () => {
        // Execute
        await engine.compileStory(uri);

        // Assert
        expect(depManager.hasNode(uri)).toBeTruthy();
        expect(depManager.hasNode(includedUri)).toBeTruthy();
      });
    });
  });

  describe("recompileDependents()", () => {
    let rootUri: vscode.Uri;
    let depUri: vscode.Uri;

    beforeEach(async () => {
      // Setup documents
      rootUri = mockVSCodeUri("/root.ink");
      depUri = mockVSCodeUri("/dep.ink");
      docService.mockTextDocument(rootUri, `INCLUDE dep.ink`);
      docService.mockTextDocument(depUri, "Some content");

      // Setup dependency manager
      depManager.createNode(rootUri);
      depManager.createNode(depUri);
      depManager.addDependency(rootUri, depUri);

      // Assert: The graph should be correct
      expect(depManager.hasNode(rootUri)).toBeTruthy();
      expect(depManager.hasNode(depUri)).toBeTruthy();
      expect(depManager.hasDependency(rootUri, depUri)).toBeTruthy();
      expect(depManager.hasReverseDependency(depUri, rootUri)).toBeTruthy();
    });

    it("recompiles dependents when a dependency changes", async () => {
      // Execute
      const results = await engine.recompileDependents(depUri);

      // Assert
      expect(results.hasResult(rootUri)).toBeTruthy();
      const rootResult = results.getResult(rootUri) as ISuccessfulBuildResult;
      console.log(rootResult.diagnostics);
      expect(rootResult.success).toBeTruthy();
      expect(diagnosticsService.mockDiagnosticsForUri(rootUri)).toHaveLength(0);
    });
  });
});
