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
import { PipelineContext } from "../../src/build/PipelineContext";
import { mockVSCodeDocument } from "../__mocks__/mockVSCodeDocument";
import { mockVSCodeUri } from "../__mocks__/mockVSCodeUri";
import { AdvancedPathResolutionStrategy } from "../../src/util/paths/AdvancedPathResolutionStrategy";

describe("PipelineContext", () => {
  let context: PipelineContext;
  let uri: vscode.Uri;
  let document: vscode.TextDocument;

  beforeEach(() => {
    uri = mockVSCodeUri("/test.ink");
    document = mockVSCodeDocument(uri, "Test content");
    context = new PipelineContext(uri, document);
  });

  describe("addDependency()", () => {
    it("should add a new dependency for a dependent", () => {
      // Setup
      const dependentUri = mockVSCodeUri("/dependent.ink");
      const dependencyUri = mockVSCodeUri("/dependency.ink");

      // Execute
      context.addDependency(dependentUri, dependencyUri);

      // Assert
      const dependencies = context.getDependencies().get(dependentUri);
      expect(dependencies).toBeDefined();
      expect(dependencies).toHaveLength(1);
      expect(dependencies?.[0]).toEqual(dependencyUri);
    });

    it("should add to existing dependencies for a dependent", () => {
      // Setup
      const dependentUri = mockVSCodeUri("/dependent.ink");
      const dependencyUri1 = mockVSCodeUri("/dependency1.ink");
      const dependencyUri2 = mockVSCodeUri("/dependency2.ink");
      context.addDependency(dependentUri, dependencyUri1);

      // Execute
      context.addDependency(dependentUri, dependencyUri2);

      // Assert
      const dependencies = context.getDependencies().get(dependentUri);
      expect(dependencies).toBeDefined();
      expect(dependencies).toHaveLength(2);
      expect(dependencies).toContain(dependencyUri1);
      expect(dependencies).toContain(dependencyUri2);
    });
  });

  describe("filterDiagnostics()", () => {
    it("should return diagnostics that match the filter", () => {
      // Setup
      context.reportDiagnostic(
        uri,
        new vscode.Range(0, 0, 0, 0),
        "Error message",
        vscode.DiagnosticSeverity.Error
      );
      context.reportDiagnostic(
        uri,
        new vscode.Range(1, 0, 1, 0),
        "Warning message",
        vscode.DiagnosticSeverity.Warning
      );

      // Execute
      const errors = context.filterDiagnostics(
        (d) => d.severity === vscode.DiagnosticSeverity.Error
      );

      // Assert
      expect(errors).toHaveLength(1);
      expect(errors[0].message).toBe("Error message");
    });
  });

  describe("filterDiagnosticsBySeverity()", () => {
    it("should return diagnostics that match the severity", () => {
      // Setup
      context.reportDiagnostic(
        uri,
        new vscode.Range(0, 0, 0, 0),
        "Error message",
        vscode.DiagnosticSeverity.Error
      );
      context.reportDiagnostic(
        uri,
        new vscode.Range(1, 0, 1, 0),
        "Another error",
        vscode.DiagnosticSeverity.Error
      );
      context.reportDiagnostic(
        uri,
        new vscode.Range(2, 0, 2, 0),
        "Warning message",
        vscode.DiagnosticSeverity.Warning
      );

      // Execute
      const errors = context.filterDiagnosticsBySeverity(
        vscode.DiagnosticSeverity.Error
      );
      const warnings = context.filterDiagnosticsBySeverity(
        vscode.DiagnosticSeverity.Warning
      );

      // Assert
      expect(errors).toHaveLength(2);
      expect(warnings).toHaveLength(1);
    });
  });

  describe("getDependencies()", () => {
    it("should return all added dependencies", () => {
      // Setup
      const dependentUri1 = mockVSCodeUri("/dependent1.ink");
      const dependencyUri1 = mockVSCodeUri("/dependency1.ink");
      const dependentUri2 = mockVSCodeUri("/dependent2.ink");
      const dependencyUri2 = mockVSCodeUri("/dependency2.ink");
      context.addDependency(dependentUri1, dependencyUri1);
      context.addDependency(dependentUri2, dependencyUri2);

      // Execute
      const allDependencies = context.getDependencies();

      // Assert
      expect(allDependencies.size).toBe(2);
      expect(allDependencies.get(dependentUri1)?.[0]).toEqual(dependencyUri1);
      expect(allDependencies.get(dependentUri2)?.[0]).toEqual(dependencyUri2);
    });
  });

  describe("getDiagnostics()", () => {
    it("should return all reported diagnostics", () => {
      // Setup
      context.reportDiagnostic(
        uri,
        new vscode.Range(0, 0, 0, 0),
        "Info message",
        vscode.DiagnosticSeverity.Information
      );
      context.reportDiagnostic(
        uri,
        new vscode.Range(1, 0, 1, 0),
        "Error message",
        vscode.DiagnosticSeverity.Error
      );

      // Execute
      const diagnostics = context.getDiagnostics();

      // Assert
      expect(diagnostics).toHaveLength(2);
    });
  });

  describe("getText()", () => {
    it("should return the document text", () => {
      // Execute
      const text = context.getText();

      // Assert
      expect(text).toBe("Test content");
    });
  });

  describe("getTextDocument()", () => {
    it("should return the document", () => {
      // Execute
      const doc = context.getTextDocument();

      // Assert
      expect(doc).toBe(document);
    });
  });

  describe("hasErrors()", () => {
    it("should return true if there are error diagnostics", () => {
      // Setup
      context.reportDiagnostic(
        uri,
        new vscode.Range(0, 0, 0, 0),
        "Error",
        vscode.DiagnosticSeverity.Error
      );

      // Execute & Assert
      expect(context.hasErrors()).toBe(true);
    });

    it("should return false if there are no error diagnostics", () => {
      // Setup
      context.reportDiagnostic(
        uri,
        new vscode.Range(0, 0, 0, 0),
        "Warning",
        vscode.DiagnosticSeverity.Warning
      );

      // Execute & Assert
      expect(context.hasErrors()).toBe(false);
    });
  });

  describe("hasInformation()", () => {
    it("should return true if there are info diagnostics", () => {
      // Setup
      context.reportDiagnostic(
        uri,
        new vscode.Range(0, 0, 0, 0),
        "Info",
        vscode.DiagnosticSeverity.Information
      );

      // Execute & Assert
      expect(context.hasInformation()).toBe(true);
    });

    it("should return false if there are no info diagnostics", () => {
      // Setup
      context.reportDiagnostic(
        uri,
        new vscode.Range(0, 0, 0, 0),
        "Warning",
        vscode.DiagnosticSeverity.Warning
      );

      // Execute & Assert
      expect(context.hasInformation()).toBe(false);
    });
  });

  describe("hasWarnings()", () => {
    it("should return true if there are warning diagnostics", () => {
      // Setup
      context.reportDiagnostic(
        uri,
        new vscode.Range(0, 0, 0, 0),
        "Warning",
        vscode.DiagnosticSeverity.Warning
      );

      // Execute & Assert
      expect(context.hasWarnings()).toBe(true);
    });

    it("should return false if there are no warning diagnostics", () => {
      // Setup
      context.reportDiagnostic(
        uri,
        new vscode.Range(0, 0, 0, 0),
        "Error",
        vscode.DiagnosticSeverity.Error
      );

      // Execute & Assert
      expect(context.hasWarnings()).toBe(false);
    });
  });

  describe("reportDiagnostic()", () => {
    it("should add a diagnostic to the context", () => {
      // Setup
      const range = new vscode.Range(0, 0, 0, 10);
      const message = "Test diagnostic";
      const severity = vscode.DiagnosticSeverity.Error;

      // Execute
      context.reportDiagnostic(uri, range, message, severity);

      // Assert
      const diagnostics = context.getDiagnostics();
      expect(diagnostics).toHaveLength(1);
      const diagnostic = diagnostics[0];
      expect(diagnostic.uri).toBe(uri);
      expect(diagnostic.range).toBe(range);
      expect(diagnostic.message).toBe(message);
      expect(diagnostic.severity).toBe(severity);
    });
  });

  describe("resolvePath()", () => {
    describe("when the InkyDefaultPathResolutionStrategy is used", () => {
      it("should resolve relative paths", () => {
        // Setup
        const contextUri = mockVSCodeUri("/context.ink");
        const path = "relative.ink";

        // Execute
        const result = context.resolvePath(contextUri, path);

        // Assert
        expect(result).not.toBeNull();
        expect(result?.toString()).toBe(
          mockVSCodeUri("/relative.ink").toString()
        );
      });

      it("should resolve relative paths with subdirectories", () => {
        // Setup
        const contextUri = mockVSCodeUri("/subdir/context.ink");
        const path = "relative.ink";

        // Execute
        const result = context.resolvePath(contextUri, path);

        // Assert
        expect(result).not.toBeNull();
        expect(result?.toString()).toBe(
          mockVSCodeUri("/subdir/relative.ink").toString()
        );
      });

      it("should resolve relative paths with parent directory traversal", () => {
        // Setup
        const contextUri = mockVSCodeUri("/subdir/context.ink");
        const path = "../parent.ink";

        // Execute
        const result = context.resolvePath(contextUri, path);

        // Assert
        expect(result).not.toBeNull();
        expect(result?.toString()).toBe(
          mockVSCodeUri("/parent.ink").toString()
        );
      });

      it("should reject absolute paths starting with forward slash", () => {
        // Setup
        const contextUri = mockVSCodeUri("/context.ink");
        const path = "/absolute.ink";

        // Execute
        const result = context.resolvePath(contextUri, path);

        // Assert
        expect(result).toBeNull();
      });

      it("should return directory for empty paths", () => {
        // Setup
        const contextUri = mockVSCodeUri("/subdir/context.ink");
        const path = "";

        // Execute
        const result = context.resolvePath(contextUri, path);

        // Assert
        expect(result).not.toBeNull();
        expect(result?.fsPath).toBe("/subdir");
      });
    });

    describe("when the AdvancedPathResolutionStrategy is used", () => {
      let advancedContext: PipelineContext;
      let originalGetWorkspaceFolder: typeof vscode.workspace.getWorkspaceFolder;

      beforeEach(() => {
        // Mock workspace.getWorkspaceFolder for AdvancedPathResolutionStrategy
        originalGetWorkspaceFolder = vscode.workspace.getWorkspaceFolder;
        (vscode.workspace as any).getWorkspaceFolder = jest
          .fn()
          .mockReturnValue({
            uri: mockVSCodeUri("/workspace"),
            name: "test-workspace",
            index: 0,
          });

        const uri = mockVSCodeUri("/test.ink");
        const document = mockVSCodeDocument(uri, "Test content");
        const strategy = new AdvancedPathResolutionStrategy();
        advancedContext = new PipelineContext(uri, document, strategy);
      });

      afterEach(() => {
        // Restore original function
        (vscode.workspace as any).getWorkspaceFolder =
          originalGetWorkspaceFolder;
      });

      it("should resolve relative paths", () => {
        // Setup
        const contextUri = mockVSCodeUri("/context.ink");
        const path = "relative.ink";

        // Execute
        const result = advancedContext.resolvePath(contextUri, path);

        // Assert
        expect(result).not.toBeNull();
        expect(result?.toString()).toBe(
          mockVSCodeUri("/relative.ink").toString()
        );
      });

      it("should resolve relative paths with subdirectories", () => {
        // Setup
        const contextUri = mockVSCodeUri("/subdir/context.ink");
        const path = "relative.ink";

        // Execute
        const result = advancedContext.resolvePath(contextUri, path);

        // Assert
        expect(result).not.toBeNull();
        expect(result?.toString()).toBe(
          mockVSCodeUri("/subdir/relative.ink").toString()
        );
      });

      it("should resolve relative paths with parent directory traversal", () => {
        // Setup
        const contextUri = mockVSCodeUri("/subdir/context.ink");
        const path = "../parent.ink";

        // Execute
        const result = advancedContext.resolvePath(contextUri, path);

        // Assert
        expect(result).not.toBeNull();
        expect(result?.toString()).toBe(
          mockVSCodeUri("/parent.ink").toString()
        );
      });

      it("should resolve absolute paths from workspace root", () => {
        // Setup
        const contextUri = mockVSCodeUri("/workspace/context.ink");
        const path = "/absolute.ink";

        // Execute
        const result = advancedContext.resolvePath(contextUri, path);

        // Assert
        expect(result).not.toBeNull();
        expect(result?.fsPath).toBe("/workspace/absolute.ink");
      });

      it("should resolve absolute paths with multiple segments", () => {
        // Setup
        const contextUri = mockVSCodeUri("/workspace/context.ink");
        const path = "/subdir/absolute.ink";

        // Execute
        const result = advancedContext.resolvePath(contextUri, path);

        // Assert
        expect(result).not.toBeNull();
        expect(result?.fsPath).toBe("/workspace/subdir/absolute.ink");
      });

      it("should resolve absolute paths regardless of context location", () => {
        // Setup
        const contextUri = mockVSCodeUri(
          "/workspace/deeply/nested/context.ink"
        );
        const path = "/absolute.ink";

        // Execute
        const result = advancedContext.resolvePath(contextUri, path);

        // Assert
        expect(result).not.toBeNull();
        expect(result?.fsPath).toBe("/workspace/absolute.ink");
      });

      it("should return directory for empty paths", () => {
        // Setup
        const contextUri = mockVSCodeUri("/workspace/subdir/context.ink");
        const path = "";

        // Execute
        const result = advancedContext.resolvePath(contextUri, path);

        // Assert
        expect(result).not.toBeNull();
        expect(result?.fsPath).toBe("/workspace/subdir");
      });
    });
  });
});
