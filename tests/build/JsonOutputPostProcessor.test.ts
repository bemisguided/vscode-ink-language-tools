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
import { JsonOutputPostProcessor } from "../../src/build/JsonOutputPostProcessor";
import { MockVSCodeConfigurationService } from "../__mocks__/MockVSCodeConfigurationService";
import { MockVSCodeDocumentService } from "../__mocks__/MockVSCodeDocumentService";
import { PipelineContext } from "../../src/build/PipelineContext";
import { Story } from "inkjs";
import { glob } from "../../src/util/glob";
import { mockVSCodeUri } from "../__mocks__/mockVSCodeUri";

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

describe("JsonOutputPostProcessor", () => {
  let configService: MockVSCodeConfigurationService;
  let documentService: MockVSCodeDocumentService;
  let processor: JsonOutputPostProcessor;
  let context: PipelineContext;
  let storyContent: string;
  const inkFile = mockVSCodeUri("/test.ink");

  beforeEach(() => {
    configService = new MockVSCodeConfigurationService();
    documentService = new MockVSCodeDocumentService(configService);
    processor = new JsonOutputPostProcessor(configService, documentService);
    context = new PipelineContext(inkFile, {} as vscode.TextDocument);
    storyContent = "story content";
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
    context.story = mockStory(storyContent);

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
    context.story = mockStory(storyContent);

    // Execute
    await processor.run(context);

    // Assert
    expect(documentService.writtenFiles.size).toBe(0);
  });

  describe("when emission is enabled", () => {
    beforeEach(() => {
      configService.mockSettings["ink.compile.output.enableEmitStoryJSON"] =
        true;
      context.story = mockStory(storyContent);
    });

    it("should write json file to default output directory", async () => {
      // Execute
      await processor.run(context);

      // Assert
      expect(documentService.writtenFiles.size).toBe(1);
      const outputUri = documentService.resolveOutputFileUri(inkFile, "json");
      expect(outputUri!.toString()).toBe(
        mockVSCodeUri("/out/test.json").toString()
      );
      expect(documentService.mockGetWrittenFile(outputUri!)).toBe(storyContent);
    });

    it("should write json file to configured output directory", async () => {
      // Setup
      configService.mockSettings["ink.compile.output.directory"] = "custom_out";

      // Execute
      await processor.run(context);

      // Assert
      expect(documentService.writtenFiles.size).toBe(1);
      const outputUri = documentService.resolveOutputFileUri(inkFile, "json");
      expect(outputUri!.toString()).toBe(
        mockVSCodeUri("/custom_out/test.json").toString()
      );
      expect(documentService.mockGetWrittenFile(outputUri!)).toBe(storyContent);
    });
  });
});
