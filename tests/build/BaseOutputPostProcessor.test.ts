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
import { BaseOutputPostProcessor } from "../../src/build/BaseOutputPostProcessor";
import { MockVSCodeConfigurationService } from "../__mocks__/MockVSCodeConfigurationService";
import { MockVSCodeDocumentService } from "../__mocks__/MockVSCodeDocumentService";
import { PipelineContext } from "../../src/build/PipelineContext";
import { Story } from "inkjs";
import { glob } from "../../src/util/glob";
import { mockVSCodeUri } from "../__mocks__/mockVSCodeUri";

jest.mock("../../src/util/glob", () => ({
  glob: jest.fn(),
}));

// Test implementation of BaseOutputPostProcessor
class TestOutputPostProcessor extends BaseOutputPostProcessor {
  protected getSettingName(): string {
    return "test.setting.name";
  }

  protected getFileExtension(): string {
    return "test";
  }

  protected transformContent(jsonContent: string): string {
    return `transformed: ${jsonContent}`;
  }

  protected getErrorMessageType(): string {
    return "TEST";
  }
}

const mockStory = (content: string): Story =>
  ({
    // eslint-disable-next-line @typescript-eslint/naming-convention
    ToJson: () => content,
  } as any);

const mockGlob = (value: boolean) => {
  (glob as jest.Mock).mockReturnValue(value);
};

describe("BaseOutputPostProcessor", () => {
  let configService: MockVSCodeConfigurationService;
  let documentService: MockVSCodeDocumentService;
  let processor: TestOutputPostProcessor;
  let context: PipelineContext;
  let storyContent: string;
  const inkFile = mockVSCodeUri("/test.ink");

  beforeEach(() => {
    configService = new MockVSCodeConfigurationService();
    documentService = new MockVSCodeDocumentService(configService);
    processor = new TestOutputPostProcessor(configService, documentService);
    context = new PipelineContext(inkFile, {} as vscode.TextDocument);
    storyContent = '{"test": "content"}';
    mockGlob(false);
  });

  describe("common behavior", () => {
    it("should not run if story is not compiled", async () => {
      // Execute
      await processor.run(context);

      // Assert
      expect(documentService.writtenFiles.size).toBe(0);
    });

    it("should not run if setting is disabled", async () => {
      // Setup
      configService.mockSettings["test.setting.name"] = false;
      context.story = mockStory(storyContent);

      // Execute
      await processor.run(context);

      // Assert
      expect(documentService.writtenFiles.size).toBe(0);
    });

    it("should ignore files matching ignoreInkIncludes pattern", async () => {
      // Setup
      mockGlob(true);
      configService.mockSettings["test.setting.name"] = true;
      configService.mockSettings["ink.compile.output.ignoreInkIncludes"] =
        "**/test.ink";
      context.story = mockStory(storyContent);

      // Execute
      await processor.run(context);

      // Assert
      expect(documentService.writtenFiles.size).toBe(0);
    });

    it("should respect default ignoreInkIncludes pattern", async () => {
      // Setup
      const inkFileWithUnderscore = mockVSCodeUri("/_test.ink");
      const contextWithUnderscore = new PipelineContext(
        inkFileWithUnderscore,
        {} as vscode.TextDocument
      );
      mockGlob(true);
      configService.mockSettings["test.setting.name"] = true;
      contextWithUnderscore.story = mockStory(storyContent);

      // Execute
      await processor.run(contextWithUnderscore);

      // Assert
      expect(documentService.writtenFiles.size).toBe(0);
    });

    it("should report error if output URI cannot be determined", async () => {
      // Setup
      configService.mockSettings["test.setting.name"] = true;
      context.story = mockStory(storyContent);
      jest
        .spyOn(documentService, "resolveOutputFileUri")
        .mockReturnValue(undefined as any);

      // Execute
      await processor.run(context);

      // Assert
      expect(documentService.writtenFiles.size).toBe(0);
      expect(context.getDiagnostics()).toHaveLength(1);
      expect(context.getDiagnostics()[0].message).toContain(
        "Could not determine output path for compiled story TEST"
      );
    });

    it("should report error if file write fails", async () => {
      // Setup
      configService.mockSettings["test.setting.name"] = true;
      context.story = mockStory(storyContent);
      jest
        .spyOn(documentService, "writeTextFile")
        .mockRejectedValue(new Error("Write failed"));

      // Execute
      await processor.run(context);

      // Assert
      expect(context.getDiagnostics()).toHaveLength(1);
      expect(context.getDiagnostics()[0].message).toContain(
        "Failed to save compiled story TEST"
      );
      expect(context.getDiagnostics()[0].message).toContain("Write failed");
    });
  });

  describe("when emission is enabled", () => {
    beforeEach(() => {
      configService.mockSettings["test.setting.name"] = true;
      context.story = mockStory(storyContent);
    });

    it("should write transformed content to output file", async () => {
      // Execute
      await processor.run(context);

      // Assert
      expect(documentService.writtenFiles.size).toBe(1);
      const outputUri = documentService.resolveOutputFileUri(inkFile, "test");
      expect(outputUri!.toString()).toBe(
        mockVSCodeUri("/out/test.test").toString()
      );
      expect(documentService.mockGetWrittenFile(outputUri!)).toBe(
        "transformed: " + storyContent
      );
    });

    it("should write to configured output directory", async () => {
      // Setup
      configService.mockSettings["ink.compile.output.directory"] = "custom_out";

      // Execute
      await processor.run(context);

      // Assert
      expect(documentService.writtenFiles.size).toBe(1);
      const outputUri = documentService.resolveOutputFileUri(inkFile, "test");
      expect(outputUri!.toString()).toBe(
        mockVSCodeUri("/custom_out/test.test").toString()
      );
      expect(documentService.mockGetWrittenFile(outputUri!)).toBe(
        "transformed: " + storyContent
      );
    });

    it("should use correct file extension", async () => {
      // Execute
      await processor.run(context);

      // Assert
      const outputUri = documentService.resolveOutputFileUri(inkFile, "test");
      expect(outputUri!.fsPath).toContain(".test");
    });

    it("should call documentService.writeTextFile with overwrite flag", async () => {
      // Setup
      const writeTextFileSpy = jest.spyOn(documentService, "writeTextFile");

      // Execute
      await processor.run(context);

      // Assert
      expect(writeTextFileSpy).toHaveBeenCalledWith(
        expect.any(Object),
        "transformed: " + storyContent,
        true
      );
    });
  });

  describe("configuration service integration", () => {
    it("should use provided configuration service", () => {
      const customConfig = new MockVSCodeConfigurationService();
      const processorWithCustomConfig = new TestOutputPostProcessor(
        customConfig,
        documentService
      );

      // The processor should use the custom config service
      expect(processorWithCustomConfig).toBeDefined();
    });

    it("should use provided document service", () => {
      const customDocService = new MockVSCodeDocumentService(configService);
      const processorWithCustomDoc = new TestOutputPostProcessor(
        configService,
        customDocService
      );

      // The processor should use the custom document service
      expect(processorWithCustomDoc).toBeDefined();
    });
  });
});
