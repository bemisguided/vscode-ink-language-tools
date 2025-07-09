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
import { JavaScriptOutputPostProcessor } from "../../src/build/JavaScriptOutputPostProcessor";
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

describe("JavaScriptOutputPostProcessor", () => {
  let configService: MockVSCodeConfigurationService;
  let documentService: MockVSCodeDocumentService;
  let processor: JavaScriptOutputPostProcessor;
  let context: PipelineContext;
  let storyContent: string;
  const inkFile = mockVSCodeUri("/test.ink");

  beforeEach(() => {
    configService = new MockVSCodeConfigurationService();
    documentService = new MockVSCodeDocumentService(configService);
    processor = new JavaScriptOutputPostProcessor(
      configService,
      documentService
    );
    context = new PipelineContext(inkFile, {} as vscode.TextDocument);
    storyContent = '{"inkVersion":21,"root":{"#f":5,"#n":"g0"}}';
    mockGlob(false);
  });

  it("should not run if story is not compiled", async () => {
    // Execute
    await processor.run(context);

    // Assert
    expect(documentService.writtenFiles.size).toBe(0);
  });

  it("should not run if enableEmitStoryJavaScript is false", async () => {
    // Setup
    configService.mockSettings["ink.compile.output.enableEmitStoryJavaScript"] =
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
    configService.mockSettings["ink.compile.output.enableEmitStoryJavaScript"] =
      true;
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
    configService.mockSettings["ink.compile.output.enableEmitStoryJavaScript"] =
      true;
    contextWithUnderscore.story = mockStory(storyContent);

    // Execute
    await processor.run(contextWithUnderscore);

    // Assert
    expect(documentService.writtenFiles.size).toBe(0);
  });

  it("should report error if output URI cannot be determined", async () => {
    // Setup
    configService.mockSettings["ink.compile.output.enableEmitStoryJavaScript"] =
      true;
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
      "Could not determine output path for compiled story JavaScript"
    );
  });

  it("should report error if file write fails", async () => {
    // Setup
    configService.mockSettings["ink.compile.output.enableEmitStoryJavaScript"] =
      true;
    context.story = mockStory(storyContent);
    jest
      .spyOn(documentService, "writeTextFile")
      .mockRejectedValue(new Error("Write failed"));

    // Execute
    await processor.run(context);

    // Assert
    expect(context.getDiagnostics()).toHaveLength(1);
    expect(context.getDiagnostics()[0].message).toContain(
      "Failed to save compiled story JavaScript"
    );
    expect(context.getDiagnostics()[0].message).toContain("Write failed");
  });

  describe("when emission is enabled", () => {
    beforeEach(() => {
      configService.mockSettings[
        "ink.compile.output.enableEmitStoryJavaScript"
      ] = true;
      context.story = mockStory(storyContent);
    });

    it("should write JavaScript file to default output directory", async () => {
      // Execute
      await processor.run(context);

      // Assert
      expect(documentService.writtenFiles.size).toBe(1);
      const outputUri = documentService.resolveOutputFileUri(inkFile, "js");
      expect(outputUri!.toString()).toBe(
        mockVSCodeUri("/out/test.js").toString()
      );
      expect(documentService.mockGetWrittenFile(outputUri!)).toBe(
        `var storyContent = ${storyContent};`
      );
    });

    it("should write JavaScript file to configured output directory", async () => {
      // Setup
      configService.mockSettings["ink.compile.output.directory"] = "custom_out";

      // Execute
      await processor.run(context);

      // Assert
      expect(documentService.writtenFiles.size).toBe(1);
      const outputUri = documentService.resolveOutputFileUri(inkFile, "js");
      expect(outputUri!.toString()).toBe(
        mockVSCodeUri("/custom_out/test.js").toString()
      );
      expect(documentService.mockGetWrittenFile(outputUri!)).toBe(
        `var storyContent = ${storyContent};`
      );
    });

    it("should use .js file extension", async () => {
      // Execute
      await processor.run(context);

      // Assert
      const outputUri = documentService.resolveOutputFileUri(inkFile, "js");
      expect(outputUri!.fsPath).toContain(".js");
    });

    it("should wrap JSON content in JavaScript variable", async () => {
      // Setup
      const testJsonContent = '{"test": "data", "number": 42}';
      context.story = mockStory(testJsonContent);

      // Execute
      await processor.run(context);

      // Assert
      const outputUri = documentService.resolveOutputFileUri(inkFile, "js");
      const writtenContent = documentService.mockGetWrittenFile(outputUri!);
      expect(writtenContent).toBe(`var storyContent = ${testJsonContent};`);
    });

    it("should handle complex JSON structures", async () => {
      // Setup
      const complexJsonContent =
        '{"inkVersion":21,"root":{"#f":5,"#n":"g0"},"listDefs":{}}';
      context.story = mockStory(complexJsonContent);

      // Execute
      await processor.run(context);

      // Assert
      const outputUri = documentService.resolveOutputFileUri(inkFile, "js");
      const writtenContent = documentService.mockGetWrittenFile(outputUri!);
      expect(writtenContent).toBe(`var storyContent = ${complexJsonContent};`);
      expect(writtenContent).toContain("var storyContent = {");
      expect(writtenContent).toContain("inkVersion");
      expect(writtenContent).toContain("root");
    });

    it("should call documentService.writeTextFile with correct parameters", async () => {
      // Setup
      const writeTextFileSpy = jest.spyOn(documentService, "writeTextFile");

      // Execute
      await processor.run(context);

      // Assert
      expect(writeTextFileSpy).toHaveBeenCalledWith(
        expect.any(Object),
        `var storyContent = ${storyContent};`,
        true
      );
    });
  });

  describe("constructor", () => {
    it("should work with provided services", () => {
      const customProcessor = new JavaScriptOutputPostProcessor(
        configService,
        documentService
      );
      expect(customProcessor).toBeDefined();
    });

    it("should work with default services", () => {
      const defaultProcessor = new JavaScriptOutputPostProcessor();
      expect(defaultProcessor).toBeDefined();
    });
  });

  describe("abstract method implementations", () => {
    it("should return correct setting name", () => {
      const settingName = (processor as any).getSettingName();
      expect(settingName).toBe("ink.compile.output.enableEmitStoryJavaScript");
    });

    it("should return correct file extension", () => {
      const extension = (processor as any).getFileExtension();
      expect(extension).toBe("js");
    });

    it("should return correct error message type", () => {
      const errorType = (processor as any).getErrorMessageType();
      expect(errorType).toBe("JavaScript");
    });

    it("should transform content correctly", () => {
      const testContent = '{"test": "value"}';
      const transformed = (processor as any).transformContent(testContent);
      expect(transformed).toBe(`var storyContent = ${testContent};`);
    });
  });
});
