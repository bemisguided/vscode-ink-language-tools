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
import { IPipelineProcessor } from "./IPipelineProcessor";
import { PipelineContext } from "./PipelineContext";

const MOCK_REGEX = /^\s*\/\/\s*MOCKS?\s+(.+\.js)$/gm;

/**
 * Pipeline processor for extracting mock files from an Ink story.
 */
export class MockExtractionProcessor implements IPipelineProcessor {
  // Private Methods ===================================================================================================

  // Public Methods ===================================================================================================

  async run(context: PipelineContext): Promise<void> {
    const text = await context.getText();
    let match: RegExpExecArray | null;
    while ((match = MOCK_REGEX.exec(text)) !== null) {
      const path = match[1].trim();
      const prior = text.slice(0, match.index);
      const line = prior.split(/\r?\n/).length - 1;
      const startChar = match.index + match[0].indexOf(path);
      const endChar = startChar + path.length;
      const range = new vscode.Range(
        new vscode.Position(line, startChar),
        new vscode.Position(line, endChar)
      );
      const target = context.resolvePath(context.uri, path);
      if (target) {
        // TODO: Handle mock file processing
        // For now, just resolve the path using the strategy
      }
    }
  }
}
