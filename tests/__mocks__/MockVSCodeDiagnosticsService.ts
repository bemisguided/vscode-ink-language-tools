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
import { IVSCodeDiagnosticsService } from "../../src/services/VSCodeDiagnosticsService";

export class MockVSCodeDiagnosticsService implements IVSCodeDiagnosticsService {
  private diagnostics = new Map<string, vscode.Diagnostic[]>();

  // Helper for tests
  mockDiagnosticsForUri(uri: vscode.Uri): vscode.Diagnostic[] | undefined {
    return this.diagnostics.get(uri.toString());
  }
  set(uri: vscode.Uri, diagnostics: vscode.Diagnostic[]): void {
    this.diagnostics.set(uri.toString(), diagnostics);
  }

  get(uri: vscode.Uri): readonly vscode.Diagnostic[] | undefined {
    return this.diagnostics.get(uri.toString());
  }

  delete(uri: vscode.Uri): void {
    this.diagnostics.delete(uri.toString());
  }

  clear(uri?: vscode.Uri): void {
    if (uri) {
      this.diagnostics.delete(uri.toString());
    } else {
      this.diagnostics.clear();
    }
  }

  dispose(): void {
    // No-op for mock
  }
}
