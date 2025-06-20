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
import { JsonOutputProcessor } from "../../src/build/JsonOutputProcessor";
import { MockVSCodeConfigurationService } from "../__mocks__/MockVSCodeConfigurationService";
import { MockVSCodeDocumentService } from "../__mocks__/MockVSCodeDocumentService";
import { PipelineContext } from "../../src/build/PipelineContext";
import { Story } from "inkjs";
import { VSCodeDiagnosticsService } from "../../src/services/VSCodeDiagnosticsService";
import { glob } from "../../src/util/glob";

jest.mock("../../src/util/glob", () => ({
  glob: jest.fn(),
}));

const mockStory = (content: string): Story =>
  ({
    // eslint-disable-next-line @typescript-eslint/naming-convention
    ToJson: () => content,
  } as any);

const mockGlob = (value: boolean) => {
  (glob as jest.Mock).mockReturnValue(value);
};

describe("JsonOutputProcessor", () => {
  let configService: MockVSCodeConfigurationService;
  let documentService: MockVSCodeDocumentService;
  let processor: JsonOutputProcessor;
  let context: PipelineContext;
  const inkFile = vscode.Uri.file("/test.ink");

  beforeEach(() => {
    configService = new MockVSCodeConfigurationService();
    documentService = new MockVSCodeDocumentService();
    processor = new JsonOutputProcessor(configService, documentService);
    context = new PipelineContext(
      inkFile,
      {} as VSCodeDiagnosticsService,
      documentService
    );
    mockGlob(false);
  });

  it("should not run if story is not compiled", async () => {
    // Execute
    await processor.run(context);
    // Assert
    expect(documentService.writtenFiles.size).toBe(0);
  });

  it("should not run if enableEmitStoryJSON is false", async () => {
    // Setup
    configService.mockSettings["ink.compile.output.enableEmitStoryJSON"] =
      false;
    context.compiledStory = mockStory("story content");
    // Execute
    await processor.run(context);
    // Assert
    expect(documentService.writtenFiles.size).toBe(0);
  });

  it("should ignore files matching ignoreInkIncludes pattern", async () => {
    // Setup
    mockGlob(true);
    configService.mockSettings["ink.compile.output.enableEmitStoryJSON"] = true;
    configService.mockSettings["ink.compile.output.ignoreInkIncludes"] =
      "**/test.ink";
    context.compiledStory = mockStory("story content");

    // Execute
    await processor.run(context);

    // Assert
    expect(documentService.writtenFiles.size).toBe(0);
  });

  it("should write json file to default output directory", async () => {
    // Setup
    configService.mockSettings["ink.compile.output.enableEmitStoryJSON"] = true;
    const storyContent = "story content";
    context.compiledStory = mockStory(storyContent);

    // Execute
    await processor.run(context);

    // Assert
    expect(documentService.writtenFiles.size).toBe(1);
    const outputUri = documentService.resolveOutputUri(inkFile, "out", "json");
    expect(documentService.writtenFiles.get(outputUri!.toString())).toBe(
      storyContent
    );
  });

  it("should write json file to configured output directory", async () => {
    // Setup
    configService.mockSettings["ink.compile.output.enableEmitStoryJSON"] = true;
    configService.mockSettings["ink.compile.output.directory"] = "custom_out";
    const storyContent = "story content";
    context.compiledStory = mockStory(storyContent);

    // Execute
    await processor.run(context);

    // Assert
    expect(documentService.writtenFiles.size).toBe(1);
    const outputUri = documentService.resolveOutputUri(
      inkFile,
      "custom_out",
      "json"
    );
    expect(documentService.writtenFiles.get(outputUri!.toString())).toBe(
      storyContent
    );
  });
});
