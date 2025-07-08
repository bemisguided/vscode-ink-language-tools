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
import { ExternalFunctionPreProcessor } from "../../src/build/ExternalFunctionPreProcessor";
import { PipelineContext } from "../../src/build/PipelineContext";
import { mockVSCodeDocument } from "../__mocks__/mockVSCodeDocument";
import { mockVSCodeUri } from "../__mocks__/mockVSCodeUri";
import { VSCodeServiceLocator } from "../../src/services/VSCodeServiceLocator";
import { MockVSCodeDocumentService } from "../__mocks__/MockVSCodeDocumentService";
import { Fixtures } from "../fixtures";
import * as fs from "fs";
import * as path from "path";

/**
 * Helper function to get the actual external functions JavaScript content
 * This ensures tests use the same content as the fixture file
 */
function getExternalFunctionsContent(): string {
  const externalFunctionsPath = path.join(
    __dirname,
    "../fixtures/external-functions.js"
  );
  return fs.readFileSync(externalFunctionsPath, "utf8");
}

describe("ExternalFunctionPreProcessor", () => {
  let processor: ExternalFunctionPreProcessor;
  let context: PipelineContext;
  let testUri: vscode.Uri;
  let mockDocumentService: MockVSCodeDocumentService;

  beforeEach(() => {
    processor = new ExternalFunctionPreProcessor();
    testUri = mockVSCodeUri("/test.ink");
    mockDocumentService = new MockVSCodeDocumentService();
    VSCodeServiceLocator.setDocumentService(mockDocumentService);
  });

  describe("Basic Functionality", () => {
    test("should create processor instance", () => {
      expect(processor).toBeDefined();
      expect(processor).toBeInstanceOf(ExternalFunctionPreProcessor);
    });

    test("should handle empty content without errors", async () => {
      // Setup - Using simple fixture for basic story content
      const simpleFixture = Fixtures.simple();
      context = new PipelineContext(
        testUri,
        mockVSCodeDocument(testUri, simpleFixture.inkContent)
      );

      // Execute
      await processor.run(context);

      // Assert
      expect(context.getExternalFunctionVM()).toBeUndefined();
      expect(context.getDiagnostics()).toHaveLength(0);
    });

    test("should handle content with regular comments", async () => {
      // Setup
      const inkContent = `
        // This is a regular comment
        Hello world
        /* Another comment */
        End of story
      `;
      context = new PipelineContext(
        testUri,
        mockVSCodeDocument(testUri, inkContent)
      );

      // Execute
      await processor.run(context);

      // Assert
      expect(context.getExternalFunctionVM()).toBeUndefined();
    });
  });

  describe("LINK Directive Detection", () => {
    test("should detect single-line LINK directive", async () => {
      // Setup
      const inkContent = `
        // LINK mocks.js
        Hello world
      `;
      context = new PipelineContext(
        testUri,
        mockVSCodeDocument(testUri, inkContent)
      );

      // Execute
      await processor.run(context);

      // Assert
      expect(context.getDiagnostics().length).toBeGreaterThan(0);
      expect(context.getDiagnostics()[0].message).toContain("mocks.js");
    });

    test("should detect LINKS directive", async () => {
      // Setup
      const inkContent = `
        // LINKS functions.js
        Hello world
      `;
      context = new PipelineContext(
        testUri,
        mockVSCodeDocument(testUri, inkContent)
      );

      // Execute
      await processor.run(context);

      // Assert
      expect(context.getDiagnostics().length).toBeGreaterThan(0);
      expect(context.getDiagnostics()[0].message).toContain("functions.js");
    });

    test("should detect LINK in multi-line comment", async () => {
      // Setup
      const inkContent = `
        /*
          LINK mocks.js
        */
        Hello world
      `;
      context = new PipelineContext(
        testUri,
        mockVSCodeDocument(testUri, inkContent)
      );

      // Execute
      await processor.run(context);

      // Assert
      expect(context.getDiagnostics().length).toBeGreaterThan(0);
      expect(context.getDiagnostics()[0].message).toContain("mocks.js");
    });

    test("should detect multiple LINK directives", async () => {
      // Setup
      const inkContent = `
        // LINK first.js
        /*
          LINK second.js
        */
        Hello world
      `;
      context = new PipelineContext(
        testUri,
        mockVSCodeDocument(testUri, inkContent)
      );

      // Execute
      await processor.run(context);

      // Assert
      expect(context.getDiagnostics().length).toBeGreaterThanOrEqual(2);
    });

    test("should ignore LINK not at start of line", async () => {
      // Setup
      const inkContent = `
        // Some comment LINK mocks.js should not work
        /* prefix LINK another.js */
        Hello world
      `;
      context = new PipelineContext(
        testUri,
        mockVSCodeDocument(testUri, inkContent)
      );

      // Execute
      await processor.run(context);

      // Assert
      expect(context.getExternalFunctionVM()).toBeUndefined();
      expect(context.getDiagnostics()).toHaveLength(0);
    });

    test("should handle whitespace variations", async () => {
      // Setup
      const inkContent = `
        //   LINK   spaced.js   
        /*   
          LINK  indented.js  
        */
        Hello world
      `;
      context = new PipelineContext(
        testUri,
        mockVSCodeDocument(testUri, inkContent)
      );

      // Execute
      await processor.run(context);

      // Assert
      expect(context.getDiagnostics().length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("Error Handling", () => {
    test("should create diagnostic for missing file", async () => {
      // Setup
      const inkContent = "// LINK missing.js\nHello world";
      context = new PipelineContext(
        testUri,
        mockVSCodeDocument(testUri, inkContent)
      );

      // Execute
      await processor.run(context);

      // Assert
      const diagnostics = context.getDiagnostics();
      expect(diagnostics).toHaveLength(1);
      expect(diagnostics[0].severity).toBe(vscode.DiagnosticSeverity.Error);
      expect(diagnostics[0].message).toContain("missing.js");
      expect(diagnostics[0].message.toLowerCase()).toContain("error");
    });

    test("should not create VM when files are missing", async () => {
      // Setup
      const inkContent = `
        // LINK missing1.js
        // LINK missing2.js
        Hello world
      `;
      context = new PipelineContext(
        testUri,
        mockVSCodeDocument(testUri, inkContent)
      );

      // Execute
      await processor.run(context);

      // Assert
      expect(context.getExternalFunctionVM()).toBeUndefined();
      expect(context.getDiagnostics().length).toBeGreaterThan(0);
    });

    test("should handle processor without throwing on valid input", async () => {
      // Setup - Using simple fixture
      const simpleFixture = Fixtures.simple();
      context = new PipelineContext(
        testUri,
        mockVSCodeDocument(testUri, simpleFixture.inkContent)
      );

      // Execute & Assert
      await expect(processor.run(context)).resolves.not.toThrow();
    });
  });

  describe("Success Cases", () => {
    test("should successfully load and process valid JS file", async () => {
      // Setup - Using external fixture
      const externalFixture = Fixtures.external();
      const externalFunctions = Fixtures.externalFunctions();
      const jsUri = mockVSCodeUri("/fixtures/external-functions.js");

      // Use actual fixture external functions content (no inline mocks)
      const jsContent = getExternalFunctionsContent();

      mockDocumentService.mockTextDocument(jsUri, jsContent);
      context = new PipelineContext(
        testUri,
        mockVSCodeDocument(testUri, externalFixture.inkContent)
      );

      // Execute
      await processor.run(context);

      // Assert
      expect(context.getDiagnostics()).toHaveLength(0);
      const vm = context.getExternalFunctionVM();
      expect(vm).toBeDefined();
      expect(vm!.getFunctionNames()).toEqual(
        expect.arrayContaining(["getName", "addNumbers", "greetPlayer"])
      );

      // Verify external functions work correctly
      expect(externalFunctions.getName()).toBe("TestPlayer");
      expect(externalFunctions.addNumbers(5, 3)).toBe(8);
    });

    test("should handle complex external fixture story with all functions", async () => {
      // Setup - Using test fixture with more comprehensive testing
      const externalFixture = Fixtures.external();
      const externalFunctions = Fixtures.externalFunctions();
      const jsUri = mockVSCodeUri("/fixtures/external-functions.js");

      // Use actual fixture external functions content (no inline mocks)
      const actualJsContent = getExternalFunctionsContent();

      mockDocumentService.mockTextDocument(jsUri, actualJsContent);
      context = new PipelineContext(
        testUri,
        mockVSCodeDocument(testUri, externalFixture.inkContent)
      );

      // Execute
      await processor.run(context);

      // Assert
      expect(context.getDiagnostics()).toHaveLength(0);
      const vm = context.getExternalFunctionVM();
      expect(vm).toBeDefined();

      // Test all fixture functions
      const expectedFunctions = [
        "getName",
        "addNumbers",
        "greetPlayer",
        "multiplyNumbers",
        "formatMessage",
      ];
      expect(vm!.getFunctionNames()).toEqual(
        expect.arrayContaining(expectedFunctions)
      );

      // Verify all external functions work correctly with fixtures
      expect(externalFunctions.getName()).toBe("TestPlayer");
      expect(externalFunctions.addNumbers(5, 3)).toBe(8);
      expect(externalFunctions.greetPlayer("TestPlayer")).toBe(
        "Welcome, TestPlayer! Ready for adventure?"
      );
      expect(externalFunctions.multiplyNumbers(4, 5)).toBe(20);
      expect(externalFunctions.formatMessage("test")).toBe("[test]");
    });

    test("should handle multiple JS files using fixture functions", async () => {
      // Setup - Using fixture-style content for multiple files
      const inkContent = `
        // LINK math.js
        // LINK strings.js
        Hello world
      `;

      // Use fixture-style math functions (based on fixture external functions)
      const mathContent = `
        exports.addNumbers = function(a, b) {
          return a + b;
        };
        
        exports.multiplyNumbers = function(a, b) {
          return a * b;
        };
      `;

      // Use fixture-style string functions
      const stringContent = `
        exports.formatMessage = function(message) {
          return "[" + message + "]";
        };
        
        exports.getName = function() {
          return "TestUser";
        };
      `;

      const mathUri = mockVSCodeUri("/math.js");
      const stringUri = mockVSCodeUri("/strings.js");
      mockDocumentService.mockTextDocument(mathUri, mathContent);
      mockDocumentService.mockTextDocument(stringUri, stringContent);
      context = new PipelineContext(
        testUri,
        mockVSCodeDocument(testUri, inkContent)
      );

      // Execute
      await processor.run(context);

      // Assert
      expect(context.getDiagnostics()).toHaveLength(0);
      const vm = context.getExternalFunctionVM();
      expect(vm).toBeDefined();
      expect(vm!.getFunctionNames()).toEqual(
        expect.arrayContaining([
          "addNumbers",
          "multiplyNumbers",
          "formatMessage",
          "getName",
        ])
      );
    });

    test("should handle fixture stories without external functions", async () => {
      // Setup - Using different fixture types
      const simpleFixture = Fixtures.simple();
      const singleChoiceFixture = Fixtures.singleChoice();
      const complexFixture = Fixtures.complex();

      // Test with simple fixture (no external functions)
      context = new PipelineContext(
        testUri,
        mockVSCodeDocument(testUri, simpleFixture.inkContent)
      );

      // Execute
      await processor.run(context);

      // Assert
      expect(context.getDiagnostics()).toHaveLength(0);
      expect(context.getExternalFunctionVM()).toBeUndefined();

      // Verify fixture content is as expected
      expect(simpleFixture.inkContent).toContain("Hello world!");
      expect(singleChoiceFixture.inkContent).toContain("dark room");
      expect(complexFixture.inkContent).toContain("mysterious forest");
    });
  });

  describe("Private Method Testing", () => {
    test("should extract LINK directives from content", () => {
      // Setup
      const content = `
        // LINK file1.js
        Some content
        /* LINK file2.js */
        More content
      `;
      const extractMethod = (processor as any).parseLinkDirectives.bind(
        processor
      );

      // Execute
      const directives = extractMethod(content);

      // Assert
      expect(directives).toHaveLength(2);
      expect(directives[0].path).toBe("file1.js");
      expect(directives[1].path).toBe("file2.js");
      expect(directives[0].line).toBe(1); // 0-indexed line
      expect(directives[1].line).toBe(3); // 0-indexed line (accounting for multi-line comment)
    });

    test("should ignore invalid LINK patterns", () => {
      // Setup
      const content = `
        // Some LINK in middle
        /* prefix LINK suffix */
        //LINK nospace
      `;
      const extractMethod = (processor as any).parseLinkDirectives.bind(
        processor
      );

      // Execute
      const directives = extractMethod(content);

      // Assert
      expect(directives).toHaveLength(0);
    });
  });
});
