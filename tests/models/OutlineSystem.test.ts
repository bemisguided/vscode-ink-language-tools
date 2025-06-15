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
import { OutlineSystem } from "../../src/systems/OutlineSystem";
import { OutlineManager } from "../../src/model/OutlineManager";
import { OutlineEntity, SymbolType } from "../../src/model/OutlineEntity";
import { mapOutlineEntitiesToSymbols } from "../../src/build/outline/mapOutlineEntitiesToSymbols";

describe("OutlineSystem (integration)", () => {
  function mockDocument(uri: string, text: string): vscode.TextDocument {
    return {
      uri: vscode.Uri.file(uri),
      getText: () => text,
    } as vscode.TextDocument;
  }

  beforeEach(() => {
    OutlineManager.getInstance().clear();
  });

  it("returns mapped symbols from outline entities and caches result", async () => {
    // Setup
    const doc = mockDocument("/foo/bar.ink", "== knot1 ==");
    const outlineSystem = new OutlineSystem();
    const entity = new OutlineEntity(
      "knot1",
      SymbolType.knot,
      0,
      new vscode.Range(0, 0, 0, 8),
      new vscode.Range(0, 0, 0, 8)
    );
    OutlineManager.getInstance().setOutline(doc.uri, [entity]);

    // Execute
    const result = await outlineSystem.getDocumentSymbols(doc);

    // Assert
    expect(result).toEqual(mapOutlineEntitiesToSymbols([entity]));
  });

  it("parses and caches if outline does not exist", async () => {
    // Setup
    const doc = mockDocument("/foo/bar.ink", "== knot1 ==");
    const outlineSystem = new OutlineSystem();
    OutlineManager.getInstance().clear();

    // Execute
    const result = await outlineSystem.getDocumentSymbols(doc);

    // Assert
    expect(result.length).toBeGreaterThan(0);
    expect(OutlineManager.getInstance().getOutline(doc.uri)).toBeDefined();
  });
});
