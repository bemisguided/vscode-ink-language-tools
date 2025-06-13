import * as vscode from "vscode";
import { OutlineManager } from "../../src/dependencies/OutlineManager";
import {
  OutlineEntity,
  SymbolType,
} from "../../src/dependencies/OutlineEntity";

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
    const manager = OutlineManager.getInstance();
    const uri = mockUri("/fake/path.ink");
    const entities = [mockEntity("knot1"), mockEntity("knot2")];

    manager.setOutline(uri, entities);
    const result = manager.getOutline(uri);

    expect(result).toBeDefined();
    expect(result).toHaveLength(2);
    expect(result![0].name).toBe("knot1");
    expect(result![1].name).toBe("knot2");
  });

  it("should return undefined for URIs with no outline", () => {
    const manager = OutlineManager.getInstance();
    const uri = mockUri("/no/outline.ink");
    expect(manager.getOutline(uri)).toBeUndefined();
  });
});
