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

import { ExternalFunctionVM } from "../../src/build/ExternalFunctionVM";
import { Story } from "inkjs/engine/Story";
import { Fixtures } from "../fixtures";

describe("ExternalFunctionVM", () => {
  let vm: ExternalFunctionVM;

  beforeEach(() => {
    vm = new ExternalFunctionVM();
  });

  afterEach(() => {
    if (vm) {
      vm.dispose();
    }
  });

  describe("Construction and Initialization", () => {
    test("should create VM with empty state", () => {
      expect(vm.getFunctionNames()).toEqual([]);
      expect(vm.hasErrors()).toBe(false);
      expect(vm.getErrors()).toEqual([]);
    });

    test("should not be disposed initially", () => {
      expect(() => vm.getFunctionNames()).not.toThrow();
    });
  });

  describe("JavaScript Content Loading", () => {
    test("should load valid CommonJS exports", () => {
      // Setup
      const jsContent = `
        exports.testFunction = function(arg) {
          return 'test_' + arg;
        };
        
        exports.anotherFunction = function(a, b) {
          return a + b;
        };
      `;

      // Execute
      const conflicts = vm.addJavaScriptContent(jsContent, "test.js");

      // Assert
      expect(conflicts).toEqual([]);
      expect(vm.getFunctionNames()).toEqual([
        "testFunction",
        "anotherFunction",
      ]);
      expect(vm.hasErrors()).toBe(false);
    });

    test("should load valid module.exports", () => {
      // Setup
      const jsContent = `
        module.exports = {
          testFunction: function(arg) {
            return 'test_' + arg;
          },
          anotherFunction: function(a, b) {
            return a + b;
          }
        };
      `;

      // Execute
      const conflicts = vm.addJavaScriptContent(jsContent, "test.js");

      // Assert
      expect(conflicts).toEqual([]);
      expect(vm.getFunctionNames()).toEqual([
        "testFunction",
        "anotherFunction",
      ]);
      expect(vm.hasErrors()).toBe(false);
    });

    test("should load mixed exports and module.exports", () => {
      // Setup
      const jsContent = `
        exports.exportedFunction = function() {
          return 'exported';
        };
        
        module.exports.moduleFunction = function() {
          return 'module';
        };
      `;

      // Execute
      const conflicts = vm.addJavaScriptContent(jsContent, "test.js");

      // Assert
      expect(conflicts).toEqual([]);
      // module.exports takes precedence, so only moduleFunction is extracted
      expect(vm.getFunctionNames()).toEqual(["moduleFunction"]);
      expect(vm.hasErrors()).toBe(false);
    });

    test("should prioritize module.exports over exports", () => {
      // Setup
      const jsContent = `
        exports.exportedFunction = function() {
          return 'exported';
        };
        
        // module.exports takes precedence
        module.exports = {
          moduleFunction: function() {
            return 'module';
          }
        };
      `;

      // Execute
      const conflicts = vm.addJavaScriptContent(jsContent, "test.js");

      // Assert
      expect(conflicts).toEqual([]);
      expect(vm.getFunctionNames()).toEqual(["moduleFunction"]);
      expect(vm.hasErrors()).toBe(false);
    });

    test("should handle empty JavaScript content", () => {
      // Execute
      const conflicts = vm.addJavaScriptContent("", "empty.js");

      // Assert
      expect(conflicts).toEqual([]);
      expect(vm.getFunctionNames()).toEqual([]);
      expect(vm.hasErrors()).toBe(false);
    });

    test("should handle JavaScript with only comments", () => {
      // Setup
      const jsContent = `
        // This is a comment
        /* This is a multi-line comment */
      `;

      // Execute
      const conflicts = vm.addJavaScriptContent(jsContent, "comments.js");

      // Assert
      expect(conflicts).toEqual([]);
      expect(vm.getFunctionNames()).toEqual([]);
      expect(vm.hasErrors()).toBe(false);
    });

    test("should handle JavaScript with non-function exports", () => {
      // Setup
      const jsContent = `
        exports.someValue = 42;
        exports.someString = "hello";
        exports.validFunction = function() {
          return "valid";
        };
      `;

      // Execute
      const conflicts = vm.addJavaScriptContent(jsContent, "mixed.js");

      // Assert
      expect(conflicts).toEqual([]);
      expect(vm.getFunctionNames()).toEqual(["validFunction"]);
      expect(vm.hasErrors()).toBe(false);
    });

    test("should load functions that might timeout during execution", () => {
      // Setup
      const jsContent = `
        exports.infiniteLoop = function() {
          while(true) {
            // This would timeout when called, but loads fine
          }
        };
      `;

      // Execute
      const conflicts = vm.addJavaScriptContent(jsContent, "timeout.js");

      // Assert
      expect(conflicts).toEqual([]);
      // Function loads successfully, timeout only occurs during execution
      expect(vm.getFunctionNames()).toEqual(["infiniteLoop"]);
      expect(vm.hasErrors()).toBe(false);
    });

    test("should handle actual VM execution timeout", () => {
      // Setup
      const jsContent = `
        // Infinite loop during loading (not in function)
        while(true) {
          // This should timeout during loading
        }
        
        exports.neverReached = function() {
          return 'never';
        };
      `;

      // Execute
      const conflicts = vm.addJavaScriptContent(jsContent, "load-timeout.js");

      // Assert
      expect(conflicts).toEqual([]);
      expect(vm.getFunctionNames()).toEqual([]);
      expect(vm.hasErrors()).toBe(true);
    });
  });

  describe("Function Conflict Detection", () => {
    test("should detect conflicts between different files", () => {
      // Setup
      const jsContent1 = `
        exports.conflictFunction = function() {
          return 'first';
        };
      `;
      const jsContent2 = `
        exports.conflictFunction = function() {
          return 'second';
        };
      `;

      // Execute
      vm.addJavaScriptContent(jsContent1, "first.js");
      const conflicts = vm.addJavaScriptContent(jsContent2, "second.js");

      // Assert
      expect(conflicts).toEqual(["conflictFunction"]);
      expect(vm.getFunctionNames()).toEqual(["conflictFunction"]);
      expect(vm.getFunctionSource("conflictFunction")).toBe("first.js");
    });

    test("should detect multiple conflicts", () => {
      // Setup
      const jsContent1 = `
        exports.func1 = function() { return 'first'; };
        exports.func2 = function() { return 'first'; };
      `;
      const jsContent2 = `
        exports.func1 = function() { return 'second'; };
        exports.func2 = function() { return 'second'; };
        exports.func3 = function() { return 'unique'; };
      `;

      // Execute
      vm.addJavaScriptContent(jsContent1, "first.js");
      const conflicts = vm.addJavaScriptContent(jsContent2, "second.js");

      // Assert
      expect(conflicts).toEqual(["func1", "func2"]);
      expect(vm.getFunctionNames()).toEqual(["func1", "func2", "func3"]);
    });

    test("should allow same function name in same file", () => {
      // Setup
      const jsContent = `
        exports.testFunction = function() {
          return 'first';
        };
        
        // Override in same file
        exports.testFunction = function() {
          return 'second';
        };
      `;

      // Execute
      const conflicts = vm.addJavaScriptContent(jsContent, "same.js");

      // Assert
      expect(conflicts).toEqual([]);
      expect(vm.getFunctionNames()).toEqual(["testFunction"]);
    });
  });

  describe("Error Handling", () => {
    test("should capture syntax errors", () => {
      // Setup
      const jsContent = `
        exports.badFunction = function() {
          return 'unclosed string;
        };
      `;

      // Execute
      const conflicts = vm.addJavaScriptContent(jsContent, "syntax-error.js");

      // Assert
      expect(conflicts).toEqual([]);
      expect(vm.getFunctionNames()).toEqual([]);
      expect(vm.hasErrors()).toBe(true);
      expect(vm.getErrors().length).toBeGreaterThan(0);
      expect(vm.getErrors()[0]).toContain("syntax-error.js");
    });

    test("should capture runtime errors", () => {
      // Setup
      const jsContent = `
        exports.errorFunction = function() {
          throw new Error("Runtime error");
        };
        
        // This will cause an error during execution
        nonExistentFunction();
      `;

      // Execute
      const conflicts = vm.addJavaScriptContent(jsContent, "runtime-error.js");

      // Assert
      expect(conflicts).toEqual([]);
      expect(vm.getFunctionNames()).toEqual([]);
      expect(vm.hasErrors()).toBe(true);
      expect(vm.getErrors().length).toBeGreaterThan(0);
    });

    test("should load functions that might timeout during execution", () => {
      // Setup
      const jsContent = `
        exports.infiniteLoop = function() {
          while(true) {
            // This would timeout when called, but loads fine
          }
        };
      `;

      // Execute
      const conflicts = vm.addJavaScriptContent(jsContent, "timeout.js");

      // Assert
      expect(conflicts).toEqual([]);
      // Function loads successfully, timeout only occurs during execution
      expect(vm.getFunctionNames()).toEqual(["infiniteLoop"]);
      expect(vm.hasErrors()).toBe(false);
    });

    test("should handle actual VM execution timeout", () => {
      // Setup
      const jsContent = `
        // Infinite loop during loading (not in function)
        while(true) {
          // This should timeout during loading
        }
        
        exports.neverReached = function() {
          return 'never';
        };
      `;

      // Execute
      const conflicts = vm.addJavaScriptContent(jsContent, "load-timeout.js");

      // Assert
      expect(conflicts).toEqual([]);
      expect(vm.getFunctionNames()).toEqual([]);
      expect(vm.hasErrors()).toBe(true);
    });
  });

  describe("Function Binding", () => {
    let mockStory: Story;

    beforeEach(() => {
      // Create a minimal story for testing using fixtures
      const simpleFixture = Fixtures.simple();
      mockStory = new Story(simpleFixture.storyJson);
    });

    test("should bind functions to story successfully", () => {
      // Setup
      const jsContent = `
        exports.testFunction = function(arg) {
          return 'test_' + arg;
        };
      `;
      vm.addJavaScriptContent(jsContent, "test.js");

      // Execute
      const success = vm.bindFunction(mockStory, "testFunction");

      // Assert
      expect(success).toBe(true);
    });

    test("should bind multiple functions", () => {
      // Setup
      const jsContent = `
        exports.func1 = function() { return 'one'; };
        exports.func2 = function() { return 'two'; };
      `;
      vm.addJavaScriptContent(jsContent, "test.js");

      // Execute
      const failed = vm.bindFunctions(mockStory, ["func1", "func2"]);

      // Assert
      expect(failed).toEqual([]);
    });

    test("should handle binding non-existent functions", () => {
      // Execute
      const success = vm.bindFunction(mockStory, "nonExistentFunction");

      // Assert
      expect(success).toBe(false);
    });

    test("should handle binding with callback", () => {
      // Setup
      const jsContent = `
        exports.testFunction = function(arg) {
          return 'test_' + arg;
        };
      `;
      vm.addJavaScriptContent(jsContent, "test.js");
      const callbackFn = jest.fn();

      // Execute
      const success = vm.bindFunction(mockStory, "testFunction", callbackFn);

      // Assert
      expect(success).toBe(true);
      expect(callbackFn).not.toHaveBeenCalled(); // Callback only called when function is invoked
    });

    test("should track function source correctly", () => {
      // Setup
      const jsContent = `
        exports.testFunction = function() {
          return 'test';
        };
      `;
      vm.addJavaScriptContent(jsContent, "source.js");

      // Execute & Assert
      expect(vm.getFunctionSource("testFunction")).toBe("source.js");
      expect(vm.getFunctionSource("nonExistent")).toBeUndefined();
    });
  });

  describe("VM Disposal", () => {
    test("should dispose cleanly", () => {
      // Setup
      const jsContent = `
        exports.testFunction = function() {
          return 'test';
        };
      `;
      vm.addJavaScriptContent(jsContent, "test.js");

      // Execute
      vm.dispose();

      // Assert
      expect(() => vm.addJavaScriptContent("", "test2.js")).toThrow();
    });

    test("should handle multiple disposals", () => {
      // Execute
      vm.dispose();
      vm.dispose(); // Should not throw

      // Assert
      expect(() => vm.getFunctionNames()).toThrow();
    });

    test("should prevent operations after disposal", () => {
      // Setup - Using fixture for story creation
      const simpleFixture = Fixtures.simple();
      const testStory = new Story(simpleFixture.storyJson);
      vm.dispose();

      // Execute & Assert
      expect(() => vm.addJavaScriptContent("", "test.js")).toThrow();
      expect(() => vm.bindFunction(testStory, "test")).toThrow();
    });
  });

  describe("Edge Cases", () => {
    test("should handle function names with special characters", () => {
      // Setup
      const jsContent = `
        exports['function-with-dash'] = function() {
          return 'dash';
        };
        
        exports['function_with_underscore'] = function() {
          return 'underscore';
        };
      `;

      // Execute
      const conflicts = vm.addJavaScriptContent(jsContent, "special.js");

      // Assert
      expect(conflicts).toEqual([]);
      expect(vm.getFunctionNames()).toContain("function-with-dash");
      expect(vm.getFunctionNames()).toContain("function_with_underscore");
    });

    test("should handle functions with complex parameters", () => {
      // Setup
      const jsContent = `
        exports.complexFunction = function(obj, arr, callback) {
          if (typeof callback === 'function') {
            callback(obj, arr);
          }
          return obj.value + arr.length;
        };
      `;

      // Execute
      const conflicts = vm.addJavaScriptContent(jsContent, "complex.js");

      // Assert
      expect(conflicts).toEqual([]);
      expect(vm.getFunctionNames()).toEqual(["complexFunction"]);
    });

    test("should handle very large JavaScript content", () => {
      // Setup
      let jsContent = "";
      for (let i = 0; i < 1000; i++) {
        jsContent += `exports.func${i} = function() { return ${i}; };\n`;
      }

      // Execute
      const conflicts = vm.addJavaScriptContent(jsContent, "large.js");

      // Assert
      expect(conflicts).toEqual([]);
      expect(vm.getFunctionNames()).toHaveLength(1000);
    });
  });
});
