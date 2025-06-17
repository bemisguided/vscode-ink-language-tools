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
import { mapOutlineEntitiesToSymbols } from "../../../src/build/outline/mapOutlineEntitiesToSymbols";
import { OutlineEntity, SymbolType } from "../../../src/model/OutlineEntity";

describe("mapOutlineEntitiesToSymbols", () => {
  function makeEntity(
    name: string,
    type: SymbolType,
    children: OutlineEntity[] = []
  ): OutlineEntity {
    const entity = new OutlineEntity(
      name,
      type,
      0,
      new vscode.Range(0, 0, 0, name.length),
      new vscode.Range(0, 0, 0, name.length)
    );
    for (const child of children) {
      entity.addChild(child);
    }
    return entity;
  }

  it("maps a single knot entity to a DocumentSymbol", () => {
    // Setup
    const entity = makeEntity("knot1", SymbolType.knot);

    // Execute
    const symbols = mapOutlineEntitiesToSymbols([entity]);

    // Assert
    expect(symbols).toHaveLength(1);
    expect(symbols[0].name).toBe("knot1");
    expect(symbols[0].kind).toBe(vscode.SymbolKind.Object);
    expect(symbols[0].detail).toBe("Knot");
  });

  it("maps a single include entity to a DocumentSymbol", () => {
    // Setup
    const entity = makeEntity("file.ink", SymbolType.include);

    // Execute
    const symbols = mapOutlineEntitiesToSymbols([entity]);

    // Assert
    expect(symbols[0].kind).toBe(vscode.SymbolKind.File);
    expect(symbols[0].detail).toBe("Include");
  });

  it("maps a function entity to a DocumentSymbol", () => {
    // Setup
    const entity = makeEntity("func", SymbolType.function);

    // Execute
    const symbols = mapOutlineEntitiesToSymbols([entity]);

    // Assert
    expect(symbols[0].kind).toBe(vscode.SymbolKind.Function);
    expect(symbols[0].detail).toBe("Function");
  });

  it("maps a variable entity to a DocumentSymbol", () => {
    // Setup
    const entity = makeEntity("var", SymbolType.variable);

    // Execute
    const symbols = mapOutlineEntitiesToSymbols([entity]);

    // Assert
    expect(symbols[0].kind).toBe(vscode.SymbolKind.Variable);
    expect(symbols[0].detail).toBe("Variable");
  });

  it("maps a list entity to a DocumentSymbol", () => {
    // Setup
    const entity = makeEntity("list", SymbolType.list);

    // Execute
    const symbols = mapOutlineEntitiesToSymbols([entity]);

    // Assert
    expect(symbols[0].kind).toBe(vscode.SymbolKind.Enum);
    expect(symbols[0].detail).toBe("List");
  });

  it("maps a listItem entity to a DocumentSymbol", () => {
    // Setup
    const entity = makeEntity("item", SymbolType.listItem);

    // Execute
    const symbols = mapOutlineEntitiesToSymbols([entity]);

    // Assert
    expect(symbols[0].kind).toBe(vscode.SymbolKind.EnumMember);
    expect(symbols[0].detail).toBe("List Item");
  });

  it("maps a const entity to a DocumentSymbol", () => {
    // Setup
    const entity = makeEntity("CONST", SymbolType.const);

    // Execute
    const symbols = mapOutlineEntitiesToSymbols([entity]);

    // Assert
    expect(symbols[0].kind).toBe(vscode.SymbolKind.Constant);
    expect(symbols[0].detail).toBe("Constant");
  });

  it("maps an external entity to a DocumentSymbol", () => {
    // Setup
    const entity = makeEntity("EXTERNAL", SymbolType.external);

    // Execute
    const symbols = mapOutlineEntitiesToSymbols([entity]);

    // Assert
    expect(symbols[0].kind).toBe(vscode.SymbolKind.Function);
    expect(symbols[0].detail).toBe("External Function");
  });

  it("maps nested entities as children", () => {
    // Setup
    const child = makeEntity("child", SymbolType.stitch);
    const parent = makeEntity("parent", SymbolType.knot, [child]);

    // Execute
    const symbols = mapOutlineEntitiesToSymbols([parent]);

    // Assert
    expect(symbols[0].children).toHaveLength(1);
    expect(symbols[0].children[0].name).toBe("child");
    expect(symbols[0].children[0].kind).toBe(vscode.SymbolKind.Method);
  });
});
