import * as vscode from "vscode";
import { OutlineSystem } from "../../src/OutlineSystem";
import { OutlineManager } from "../../src/model/OutlineManager";
import { OutlineEntity, SymbolType } from "../../src/model/OutlineEntity";
import { mapOutlineEntitiesToSymbols } from "../../src/outline/mapOutlineEntitiesToSymbols";

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
