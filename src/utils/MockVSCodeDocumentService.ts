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
import { VSCodeDocumentService } from "./VSCodeDocumentService";

export class MockVSCodeDocumentService implements VSCodeDocumentService {
  private docs = new Map<string, vscode.TextDocument>();

  // Add or override a mock document for a given URI
  mockTextDocument(uri: vscode.Uri, document?: vscode.TextDocument): void {
    if (!document) {
      document = {
        uri,
        fileName: uri.fsPath,
        isUntitled: false,
        languageId: "ink",
        version: 1,
        isDirty: false,
        isClosed: false,
        save: jest.fn(),
        eol: 1,
        lineCount: 1,
        lineAt: jest.fn(),
        offsetAt: jest.fn(),
        positionAt: jest.fn(),
        getText: () => "",
        getWordRangeAtPosition: jest.fn(),
        validateRange: jest.fn(),
        validatePosition: jest.fn(),
        encoding: "utf8",
      } as unknown as vscode.TextDocument;
    }
    this.docs.set(uri.toString(), document);
  }

  resolvePath = (baseUri: vscode.Uri, path: string): vscode.Uri | null =>
    vscode.Uri.file(path.startsWith("/") ? path : `/${path}`);

  exists = async (baseUri: vscode.Uri, path?: string): Promise<boolean> => {
    let uri: vscode.Uri;
    if (!path) {
      uri = baseUri;
    } else {
      uri = vscode.Uri.file(path.startsWith("/") ? path : `/${path}`);
    }
    return this.docs.has(uri.toString());
  };

  getTextDocument = async (
    baseUri: vscode.Uri,
    path?: string
  ): Promise<vscode.TextDocument> => {
    let uri: vscode.Uri;
    if (!path) {
      uri = baseUri;
    } else {
      uri = vscode.Uri.file(path.startsWith("/") ? path : `/${path}`);
    }
    const doc = this.docs.get(uri.toString());
    if (!doc) {
      throw new Error(`Mock document not found for ${uri.toString()}`);
    }
    return doc;
  };

  tryGetTextDocument = async (
    baseUri: vscode.Uri,
    path?: string
  ): Promise<vscode.TextDocument | undefined> => {
    let uri: vscode.Uri;
    if (!path) {
      uri = baseUri;
    } else {
      uri = vscode.Uri.file(path.startsWith("/") ? path : `/${path}`);
    }
    return this.docs.get(uri.toString());
  };
}
