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
import { mockVSCodeUri } from "./mockVSCodeUri";

/**
 * Helper to create a mock vscode.TextDocument
 *
 * @param uri The URI of the document.
 * @param content The content of the document.
 * @returns A mock vscode.TextDocument.
 */
export function mockVSCodeDocument(
  uri: vscode.Uri | string,
  content: string,
  version: number = 1
): vscode.TextDocument {
  return {
    uri: typeof uri === "string" ? mockVSCodeUri(uri) : uri,
    fileName: typeof uri === "string" ? uri : uri.fsPath,
    isUntitled: false,
    languageId: "ink",
    version: version,
    isDirty: false,
    isClosed: false,
    save: jest.fn(),
    eol: 1,
    lineCount: content.split("\n").length,
    lineAt: jest.fn((line: number) => ({
      lineNumber: line,
      text: content.split("\n")[line],
      range: new vscode.Range(line, 0, line, content.split("\n")[line].length),
      firstNonWhitespaceCharacterIndex: 0,
      isEmptyOrWhitespace: false,
    })),
    offsetAt: jest.fn(),
    positionAt: jest.fn(),
    getText: () => content,
    getWordRangeAtPosition: jest.fn(),
    validateRange: jest.fn(),
    validatePosition: jest.fn(),
  } as unknown as vscode.TextDocument;
}
