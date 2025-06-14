import * as vscode from "vscode";
import { DependencyManager } from "../../src/model/DependencyManager";
import { DependencyNode } from "../../src/model/DependencyNode";

describe("DependencyManager", () => {
  function mockUri(path: string): vscode.Uri {
    return vscode.Uri.file(path);
  }

  beforeEach(() => {
    DependencyManager.getInstance().clearGraph();
  });

  it("setNode and getNode work as expected", () => {
    // Setup
    const manager = DependencyManager.getInstance();
    const uri = mockUri("/foo/bar.ink");
    const node = DependencyNode.fromUri(uri, 1);

    // Execute
    manager.setNode(uri, node);

    // Assert
    expect(manager.getNode(uri)).toBe(node);
  });

  it("deleteNode removes a node", () => {
    // Setup
    const manager = DependencyManager.getInstance();
    const uri = mockUri("/foo/bar.ink");
    const node = DependencyNode.fromUri(uri, 1);
    manager.setNode(uri, node);

    // Execute
    manager.deleteNode(uri);

    // Assert
    expect(manager.getNode(uri)).toBeUndefined();
  });

  it("getGraph returns the internal graph map", () => {
    // Setup
    const manager = DependencyManager.getInstance();
    const uri = mockUri("/foo/bar.ink");
    const node = DependencyNode.fromUri(uri, 1);
    manager.setNode(uri, node);

    // Execute
    const graph = manager.getGraph();

    // Assert
    expect(graph.get(uri)).toBe(node);
    expect(graph.size).toBe(1);
  });
});
