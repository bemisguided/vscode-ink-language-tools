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
import { CompilationProcessor } from "../../../src/build/compiler/CompilationProcessor";
import { PipelineContext } from "../../../src/build/PipelineContext";

describe("CompilationProcessor", () => {
  let processor: CompilationProcessor;
  let context: PipelineContext;
  let diagnostics: vscode.Diagnostic[];

  function makeContext(story: string): PipelineContext {
    diagnostics = [];
    return {
      currentUri: vscode.Uri.file("/test.ink"),
      getText: jest.fn().mockResolvedValue(story),
      report: jest.fn((range, message, severity) => {
        diagnostics.push(new vscode.Diagnostic(range, message, severity));
      }),
      compiledStory: undefined,
      diagnostics,
      includeDocuments: new Map(),
      flushDiagnostics: jest.fn(),
      resetDeps: jest.fn(),
      addDep: jest.fn(),
    } as unknown as PipelineContext;
  }

  beforeEach(() => {
    // Setup
    processor = new CompilationProcessor();
  });

  it("compiles a valid Ink story", async () => {
    // Setup
    const story = `
      -> knot1

      === knot1 ===
      Hello world.

      -> END
    `;
    context = makeContext(story);

    // Execute
    await processor.run(context);

    // Assert
    expect(context.compiledStory).toBeDefined();
    expect(diagnostics.length).toBe(0);
  });

  it("reports warnings", async () => {
    // Setup
    const story = `
      -> knot1

      === knot1 ===
      Hello world.
    `;
    context = makeContext(story);

    // Execute
    await processor.run(context);

    // Assert
    expect(diagnostics.length).toBeGreaterThan(0);
    expect(
      diagnostics.some((d) => d.severity === vscode.DiagnosticSeverity.Warning)
    ).toBe(true);
  });

  it("reports errors", async () => {
    // Setup
    const story = `
      -> knot1

      === knot1 ===
      Hello world {bad_function}.

      -> END
    `;
    context = makeContext(story);

    // Execute
    await processor.run(context);

    // Assert
    expect(diagnostics.length).toBeGreaterThan(0);
    expect(
      diagnostics.some((d) => d.severity === vscode.DiagnosticSeverity.Error)
    ).toBe(true);
  });

  it("reports TODOs", async () => {
    // Setup
    const story = `
      -> knot1

      TODO: this must be fixed.

      === knot1 ===
      Hello world.

      -> END
    `;
    context = makeContext(story);

    // Execute
    await processor.run(context);

    // Assert
    expect(diagnostics.length).toBeGreaterThan(0);
    expect(
      diagnostics.some(
        (d) => d.severity === vscode.DiagnosticSeverity.Information
      )
    ).toBe(true);
  });
});
