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
import { Story } from "inkjs/engine/Story";
import {
  ISuccessfulBuildResult,
  IFailedBuildResult,
} from "../../src/build/IBuildResult";
import { mockVSCodeUri } from "./mockVSCodeUri";

// Helper function to get fixture stories
function getFixtureStory(name: string): string {
  if (!global.testFixtures || !global.testFixtures[name]) {
    throw new Error(`Fixture "${name}" not found. Available fixtures: ${Object.keys(global.testFixtures || {}).join(", ")}`);
  }
  const fixture = global.testFixtures[name];
  if (name === "externalFunctions") {
    throw new Error(`Cannot get story JSON from external functions`);
  }
  return (fixture as any).storyJson;
}

/**
 * Creates a mock successful build result with a test story.
 * @param filePath - Optional file path for the story URI
 * @param useTestStory - Whether to use the complex test story or minimal story
 * @returns Mock successful build result
 */
export function createMockSuccessfulBuildResult(
  filePath: string = "/mock/path/test.ink",
  useSimpleStory: boolean = false
): ISuccessfulBuildResult {
  // Use the fixture stories
  const storyJson = useSimpleStory
    ? getFixtureStory("test-story-simple")
    : getFixtureStory("test-story");

  return {
    success: true,
    story: new Story(storyJson),
    diagnostics: [],
    uri: mockVSCodeUri(filePath),
  };
}

/**
 * Creates a mock failed build result with diagnostics.
 * @param filePath - Optional file path for the story URI
 * @param errorMessage - Error message for the diagnostic
 * @returns Mock failed build result
 */
export function createMockFailedBuildResult(
  filePath: string = "/mock/path/test.ink",
  errorMessage: string = "Compilation failed"
): IFailedBuildResult {
  return {
    success: false,
    diagnostics: [
      {
        uri: mockVSCodeUri(filePath),
        range: new vscode.Range(
          new vscode.Position(0, 0),
          new vscode.Position(0, 10)
        ),
        message: errorMessage,
        severity: 0, // Error severity
      },
    ],
    uri: mockVSCodeUri(filePath),
  };
}

/**
 * Creates a mock build result with custom story content.
 * @param storyJson - Custom story JSON string
 * @param filePath - Optional file path for the story URI
 * @returns Mock successful build result
 */
export function createMockBuildResultWithCustomStory(
  storyJson: string,
  filePath: string = "/mock/path/test.ink"
): ISuccessfulBuildResult {
  return {
    success: true,
    story: new Story(storyJson),
    diagnostics: [],
    uri: mockVSCodeUri(filePath),
  };
}

/**
 * The default mock build result for general testing.
 */
export const mockBuildResult = createMockSuccessfulBuildResult();
