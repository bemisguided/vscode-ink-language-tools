import * as vscode from "vscode";
import { OutlineManager } from "../../src/model/OutlineManager";
import { OutlineEntity, SymbolType } from "../../src/model/OutlineEntity";

describe("OutlineManager", () => {
  // Helper to create a mock Uri
  function mockUri(path: string): vscode.Uri {
    return vscode.Uri.file(path);
  }

  // Helper to create a mock OutlineEntity
  function mockEntity(name: string): OutlineEntity {
    // Use dummy ranges for testing
    const range = new vscode.Range(0, 0, 0, 1);
    return new OutlineEntity(name, SymbolType.knot, 0, range, range);
  }

  it("should set and get outlines for a URI", () => {
    // Setup
    const manager = OutlineManager.getInstance();
    const uri = mockUri("/fake/path.ink");
    const entities = [mockEntity("knot1"), mockEntity("knot2")];

    // Execute
    manager.setOutline(uri, entities);

    // Assert
    const result = manager.getOutline(uri);

    expect(result).toBeDefined();
    expect(result).toHaveLength(2);
    expect(result![0].name).toBe("knot1");
    expect(result![1].name).toBe("knot2");
  });

  it("should return undefined for URIs with no outline", () => {
    // Setup
    const manager = OutlineManager.getInstance();
    const uri = mockUri("/no/outline.ink");

    // Execute
    const result = manager.getOutline(uri);

    // Assert
    expect(manager.getOutline(uri)).toBeUndefined();
  });
});
