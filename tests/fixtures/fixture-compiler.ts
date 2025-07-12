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

/**
 * Jest fixture compiler for Ink stories
 * Compiles all .ink files in the fixtures directory and makes them available globally
 */

import { Compiler } from "inkjs/compiler/Compiler";
import { Story } from "inkjs/engine/Story";
import * as fs from "fs";
import * as path from "path";

/**
 * Fixture data structure
 */
interface TestFixture {
  name: string;
  inkPath: string;
  inkContent: string;
  story: Story;
  storyJson: string;
}

/**
 * Collection of all fixtures
 */
interface TestFixtures {
  [key: string]: TestFixture | { [key: string]: Function };
}

/**
 * Loaded content information
 */
interface LoadedContent {
  content: string;
  filePath: string;
}

/**
 * Simple file handler for compilation
 */
class FixtureFileHandler {
  constructor(private basePath: string) {}

  get ResolveInkFilename(): (filename: string) => string {
    return (filename: string) => filename;
  }

  get LoadInkFileContents(): (filename: string) => string {
    return (filename: string) => {
      const fullPath = path.resolve(this.basePath, filename);
      return fs.readFileSync(fullPath, "utf8");
    };
  }
}

/**
 * Compiles an Ink story file
 */
function compileStory(inkPath: string, basePath: string): Story {
  const inkContent = fs.readFileSync(inkPath, "utf8");
  const compiler = new Compiler(inkContent, {
    sourceFilename: inkPath,
    fileHandler: new FixtureFileHandler(basePath),
    pluginNames: [],
    countAllVisits: true,
    errorHandler: (message: string, type: any): void => {
      // Silent error handling for tests
    },
  });

  return compiler.Compile();
}

/**
 * Loads JavaScript external functions
 */
function loadExternalFunctions(jsPath: string): { [key: string]: Function } {
  if (!fs.existsSync(jsPath)) {
    return {};
  }

  // Clear require cache to ensure fresh load
  delete require.cache[require.resolve(jsPath)];
  return require(jsPath);
}

/**
 * Compiles all fixtures and makes them available globally
 */
function setupFixtures(): TestFixtures {
  // Check if already initialized
  if (global.testFixtures) {
    return global.testFixtures;
  }

  const fixturesPath = path.join(__dirname);
  const fixtures: TestFixtures = {};

  // Remove existing JSON files for fresh compilation
  const jsonFiles = fs
    .readdirSync(fixturesPath)
    .filter((file) => file.endsWith(".json"));

  jsonFiles.forEach((file) => {
    const jsonPath = path.join(fixturesPath, file);
    if (fs.existsSync(jsonPath)) {
      fs.unlinkSync(jsonPath);
    }
  });

  // Find all .ink files
  const inkFiles = fs
    .readdirSync(fixturesPath)
    .filter((file) => file.endsWith(".ink"));

  inkFiles.forEach((inkFile) => {
    const inkPath = path.join(fixturesPath, inkFile);
    const baseName = path.basename(inkFile, ".ink");

    try {
      const story = compileStory(inkPath, fixturesPath);

      fixtures[baseName] = {
        name: baseName,
        inkPath: inkPath,
        inkContent: fs.readFileSync(inkPath, "utf8"),
        story: story,
        storyJson: story.ToJson() || "",
      };
    } catch (error) {
      throw error;
    }
  });

  // Load external functions
  const externalFunctionsPath = path.join(
    fixturesPath,
    "external-functions.js"
  );
  if (fs.existsSync(externalFunctionsPath)) {
    (fixtures as any).externalFunctions = loadExternalFunctions(externalFunctionsPath);
  }

  // Make available globally
  global.testFixtures = fixtures;

  return fixtures;
}

/**
 * Helper function to get a fixture
 */
function getFixture(name: string): TestFixture {
  if (!global.testFixtures || !global.testFixtures[name]) {
    throw new Error(
      `Fixture "${name}" not found. Available fixtures: ${Object.keys(
        global.testFixtures || {}
      ).join(", ")}`
    );
  }
  const fixture = global.testFixtures[name];
  if (name === "externalFunctions") {
    throw new Error(`Use getExternalFunctions() instead of getFixture("${name}")`);
  }
  return fixture as TestFixture;
}

/**
 * Helper function to get external functions
 */
function getExternalFunctions(): { [key: string]: Function } {
  return (global.testFixtures as any)?.externalFunctions || {};
}

// Export functions for use in tests
export {
  setupFixtures,
  getFixture,
  getExternalFunctions,
  TestFixture,
  TestFixtures,
};
