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
import { CompilationProcessor } from "../../src/build/CompilationProcessor";
import { PipelineContext } from "../../src/build/PipelineContext";
import { VSCodeServiceLocator } from "../../src/services/VSCodeServiceLocator";
import { MockVSCodeConfigurationService } from "../__mocks__/MockVSCodeConfigurationService";
import { mockVSCodeUri } from "../__mocks__/mockVSCodeUri";
import { mockVSCodeDocument } from "../__mocks__/mockVSCodeDocument";

describe("CompilationProcessor", () => {
  let processor: CompilationProcessor;
  let context: PipelineContext;
  let configService: MockVSCodeConfigurationService;

  function makeContext(story: string): PipelineContext {
    const doc = {
      getText: jest.fn().mockResolvedValue(story),
    } as unknown as vscode.TextDocument;
    return new PipelineContext(mockVSCodeUri("/test.ink"), doc);
  }

  beforeEach(() => {
    // Setup
    processor = new CompilationProcessor();
    configService = new MockVSCodeConfigurationService();
    VSCodeServiceLocator.setConfigurationService(configService);
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
    expect(context.story).toBeDefined();
    expect(context.getDiagnostics().length).toBe(0);
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
    expect(context.getDiagnostics().length).toBeGreaterThan(0);
    expect(context.hasWarnings()).toBe(true);
    expect(context.hasErrors()).toBe(false);
    expect(context.hasInformation()).toBe(false);
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
    expect(context.getDiagnostics().length).toBeGreaterThan(0);
    expect(context.hasWarnings()).toBe(false);
    expect(context.hasErrors()).toBe(true);
    expect(context.hasInformation()).toBe(false);
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
    expect(context.getDiagnostics().length).toBeGreaterThan(0);
    expect(context.hasWarnings()).toBe(false);
    expect(context.hasErrors()).toBe(false);
    expect(context.hasInformation()).toBe(true);
  });

  describe("when the story has an include", () => {
    beforeEach(() => {
      // Setup
      const story = `
        INCLUDE include.ink
        -> knot1

        === knot1 ===
        Hello world.

        -> END
      `;
      context = makeContext(story);

      const include = `
        -> knot2

        === knot2 ===P
        Hello world.
      `;
      context.includeDocuments.set(
        "include.ink",
        mockVSCodeDocument("/include.ink", include)
      );
    });

    it("it does not report errors with the include", async () => {
      // Execute
      await processor.run(context);

      // Assert
      expect(context.getDiagnostics().length).toBe(0);
    });
  });
});
