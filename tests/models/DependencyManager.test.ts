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
import { DependencyManager } from "../../src/model/DependencyManager";
import { DependencyNodeType } from "../../src/model/DependencyNode";
import { mockVSCodeUri } from "../__mocks__/mockVSCodeUri";

describe("DependencyManager", () => {
  let manager: DependencyManager;

  beforeEach(() => {
    manager = DependencyManager.getInstance();
    manager.clear();
  });

  describe("addDependency()", () => {
    it("should create a dependency between two nodes", () => {
      // Setup
      const storyUri = mockVSCodeUri("/story.ink");
      const depUri = mockVSCodeUri("/dep.ink");

      // Execute
      manager.addDependency(storyUri, depUri);

      // Assert
      expect(manager.hasDependency(storyUri, depUri)).toBe(true);
      expect(manager.hasReverseDependency(depUri, storyUri)).toBe(true);
    });
  });

  describe("clearGraph()", () => {
    it("should remove all nodes and dependencies from the graph", () => {
      // Setup
      const storyUri = mockVSCodeUri("/story.ink");
      const depUri = mockVSCodeUri("/dep.ink");
      manager.addDependency(storyUri, depUri);
      expect(manager.getNode(storyUri)).toBeDefined();
      expect(manager.getDependencies(storyUri).size).toBe(1);

      // Execute
      manager.clear();

      // Assert
      expect(manager.getNode(storyUri)).toBeUndefined();
      expect(manager.getDependencies(storyUri).size).toBe(0);
      expect(manager.getAllRoots().size).toBe(0);
    });
  });

  describe("createNode()", () => {
    it("should create a new node if one does not exist", () => {
      // Setup
      const uri = mockVSCodeUri("/story.ink");

      // Execute
      const node = manager.createNode(uri, 1);

      // Assert
      expect(node).toBeDefined();
      expect(node.uri).toEqual(uri);
      expect(node.version).toBe(1);
      expect(node.type).toBe(DependencyNodeType.story);
      expect(manager.getNode(uri)).toBe(node);
    });

    it("should return an existing node and update its version", () => {
      // Setup
      const uri = mockVSCodeUri("/story.ink");
      const node1 = manager.createNode(uri, 1);

      // Execute
      const node2 = manager.createNode(uri, 2);

      // Assert
      expect(node2).toBe(node1);
      expect(node2.version).toBe(2);
    });
  });

  describe("deleteNode()", () => {
    it("should remove a standalone node", () => {
      // Setup
      const uri = mockVSCodeUri("/story.ink");
      manager.createNode(uri);
      expect(manager.getNode(uri)).toBeDefined();

      // Execute
      manager.deleteNode(uri);

      // Assert
      expect(manager.getNode(uri)).toBeUndefined();
    });

    it("should remove a node and update the dependencies of its dependents", () => {
      // Setup
      const storyUri = mockVSCodeUri("/story.ink");
      const depUri = mockVSCodeUri("/dep.ink");
      manager.addDependency(storyUri, depUri);

      // Execute
      manager.deleteNode(depUri);

      // Assert
      expect(manager.getDependencies(storyUri).size).toBe(0);
    });

    it("should remove a node and update the reverse dependencies of its dependencies", () => {
      // Setup
      const storyUri = mockVSCodeUri("/story.ink");
      const depUri = mockVSCodeUri("/dep.ink");
      manager.addDependency(storyUri, depUri);

      // Execute
      manager.deleteNode(storyUri);

      // Assert
      expect(manager.getReverseDependencies(depUri).size).toBe(0);
    });
  });

  describe("getAllDependencies()", () => {
    it("should traverse a multi-level graph", () => {
      // Setup a chain: story -> dep1 -> dep2
      const storyUri = mockVSCodeUri("/story.ink");
      const dep1Uri = mockVSCodeUri("/dep1.ink");
      const dep2Uri = mockVSCodeUri("/dep2.ink");
      manager.addDependency(storyUri, dep1Uri);
      manager.addDependency(dep1Uri, dep2Uri);

      // Execute
      const allDeps = manager.getAllDependencies([storyUri]);

      // Assert
      const allDepsStrings = Array.from(allDeps).map((u) => u.toString());
      expect(allDepsStrings).toContain(dep1Uri.toString());
      expect(allDepsStrings).toContain(dep2Uri.toString());
      expect(allDepsStrings.length).toBe(2);
    });

    it("should handle cyclic dependencies gracefully", () => {
      // Setup a cycle: A -> B -> A
      const uriA = mockVSCodeUri("/A.ink");
      const uriB = mockVSCodeUri("/B.ink");
      manager.addDependency(uriA, uriB);
      manager.addDependency(uriB, uriA); // Cycle

      // Execute
      const allDeps = manager.getAllDependencies([uriA]);

      // Assert
      const allDepsStrings = Array.from(allDeps).map((u) => u.toString());
      expect(allDepsStrings).toContain(uriB.toString());
      expect(allDepsStrings.length).toBe(1); // Should not get stuck in a loop
    });
  });

  describe("getAllDependents()", () => {
    it("should traverse a multi-level graph", () => {
      // Setup a chain: story -> dep1 -> dep2
      const storyUri = mockVSCodeUri("/story.ink");
      const dep1Uri = mockVSCodeUri("/dep1.ink");
      const dep2Uri = mockVSCodeUri("/dep2.ink");
      manager.addDependency(storyUri, dep1Uri);
      manager.addDependency(dep1Uri, dep2Uri);

      // Execute
      const allDependents = manager.getAllDependents([dep2Uri]);

      // Assert
      const allDependentsStrings = Array.from(allDependents).map((u) =>
        u.toString()
      );
      expect(allDependentsStrings).toContain(dep1Uri.toString());
      expect(allDependentsStrings).toContain(storyUri.toString());
      expect(allDependentsStrings.length).toBe(2);
    });

    it("should handle cyclic dependencies gracefully", () => {
      // Setup a cycle: A -> B -> A
      const uriA = mockVSCodeUri("/A.ink");
      const uriB = mockVSCodeUri("/B.ink");
      manager.addDependency(uriA, uriB);
      manager.addDependency(uriB, uriA); // Cycle

      // Execute
      const allRevDeps = manager.getAllDependents([uriA]);

      // Assert
      const allRevDepsStrings = Array.from(allRevDeps).map((u) => u.toString());
      expect(allRevDepsStrings).toContain(uriB.toString());
      expect(allRevDepsStrings.length).toBe(1);
    });

    it("should not include non-root nodes if onlyRoots is true", () => {
      // Setup
      const storyUri = mockVSCodeUri("/story.ink");
      const dep1Uri = mockVSCodeUri("/dep1.ink");
      const dep2Uri = mockVSCodeUri("/dep2.ink");
      manager.addDependency(storyUri, dep1Uri);
      manager.addDependency(dep1Uri, dep2Uri);

      // Execute
      const allRevDeps = manager.getAllDependents([dep2Uri], true);

      // Assert
      const allRevDepsStrings = Array.from(allRevDeps).map((u) => u.toString());
      expect(allRevDepsStrings).toContain(storyUri.toString());
      expect(allRevDepsStrings).not.toContain(dep1Uri.toString());
      expect(allRevDepsStrings).not.toContain(dep2Uri.toString());
      expect(allRevDepsStrings.length).toBe(1);
    });
  });

  describe("getAllRoots()", () => {
    it("should return nodes with no reverse dependencies", () => {
      // Setup
      const root1Uri = mockVSCodeUri("/root1.ink");
      const root2Uri = mockVSCodeUri("/root2.ink");
      const dep1Uri = mockVSCodeUri("/dep1.ink");
      const dep2Uri = mockVSCodeUri("/dep2.ink");
      manager.addDependency(root1Uri, dep1Uri);
      manager.addDependency(dep1Uri, dep2Uri);
      manager.createNode(root2Uri);

      // Execute
      const roots = manager.getAllRoots();

      // Assert
      const rootsStrings = Array.from(roots).map((u) => u.toString());
      expect(rootsStrings).toContain(root1Uri.toString());
      expect(rootsStrings).toContain(root2Uri.toString());
      expect(rootsStrings).not.toContain(dep1Uri.toString());
      expect(rootsStrings).not.toContain(dep2Uri.toString());
      expect(rootsStrings.length).toBe(2);
    });
  });

  describe("getDependencies()", () => {
    it("should return the direct dependencies of a given URI", () => {
      // Setup
      const storyUri = mockVSCodeUri("/story.ink");
      const dep1Uri = mockVSCodeUri("/dep1.ink");
      const dep2Uri = mockVSCodeUri("/dep2.ink");
      manager.addDependency(storyUri, dep1Uri);
      manager.addDependency(storyUri, dep2Uri);

      // Execute
      const deps = manager.getDependencies(storyUri);

      // Assert
      const depsStrings = Array.from(deps).map((u) => u.toString());
      expect(depsStrings).toContain(dep1Uri.toString());
      expect(depsStrings).toContain(dep2Uri.toString());
      expect(depsStrings.length).toBe(2);
    });

    it("should return an empty set for a node with no dependencies", () => {
      // Setup
      const storyUri = mockVSCodeUri("/story.ink");
      manager.createNode(storyUri);

      // Execute
      const deps = manager.getDependencies(storyUri);

      // Assert
      expect(deps.size).toBe(0);
    });

    it("should return an empty set for a non-existent URI", () => {
      // Setup
      const storyUri = mockVSCodeUri("/story.ink");

      // Execute
      const deps = manager.getDependencies(storyUri);

      // Assert
      expect(deps.size).toBe(0);
    });
  });

  describe("getNode()", () => {
    it("should return the node if it exists", () => {
      // Setup
      const uri = mockVSCodeUri("/story.ink");
      const createdNode = manager.createNode(uri, 1);

      // Execute
      const foundNode = manager.getNode(uri);

      // Assert
      expect(foundNode).toBe(createdNode);
      expect(foundNode?.uri).toEqual(uri);
      expect(foundNode?.version).toBe(1);
    });

    it("should return undefined if the node does not exist", () => {
      // Setup
      const uri = mockVSCodeUri("/story.ink");

      // Execute
      const foundNode = manager.getNode(uri);

      // Assert
      expect(foundNode).toBeUndefined();
    });
  });

  describe("getReverseDependencies()", () => {
    it("should return the direct reverse dependencies of a given URI", () => {
      // Setup
      const storyUri = mockVSCodeUri("/story.ink");
      const depUri = mockVSCodeUri("/dep.ink");
      manager.addDependency(storyUri, depUri);

      // Execute
      const revDeps = manager.getReverseDependencies(depUri);

      // Assert
      const revDepsStrings = Array.from(revDeps).map((u) => u.toString());
      expect(revDepsStrings).toContain(storyUri.toString());
      expect(revDepsStrings.length).toBe(1);
    });

    it("should return an empty set for a node with no reverse dependencies", () => {
      // Setup
      const storyUri = mockVSCodeUri("/story.ink");
      manager.createNode(storyUri);

      // Execute
      const revDeps = manager.getReverseDependencies(storyUri);

      // Assert
      expect(revDeps.size).toBe(0);
    });

    it("should return an empty set for a non-existent URI", () => {
      // Setup
      const depUri = mockVSCodeUri("/dep.ink");

      // Execute
      const revDeps = manager.getReverseDependencies(depUri);

      // Assert
      expect(revDeps.size).toBe(0);
    });
  });

  describe("hasDependency()", () => {
    it("should correctly report existing and non-existing dependencies", () => {
      // Setup
      const storyUri = mockVSCodeUri("/story.ink");
      const depUri = mockVSCodeUri("/dep.ink");
      const otherUri = mockVSCodeUri("/other.ink");
      manager.addDependency(storyUri, depUri);

      // Assert
      expect(manager.hasDependency(storyUri, depUri)).toBe(true);
      expect(manager.hasDependency(storyUri, otherUri)).toBe(false);
      expect(manager.hasDependency(depUri, storyUri)).toBe(false); // Wrong direction
    });
  });

  describe("hasNode()", () => {
    it("should return true if the node exists", () => {
      // Setup
      const uri = mockVSCodeUri("/story.ink");
      manager.createNode(uri);

      // Execute
      const hasNode = manager.hasNode(uri);

      // Assert
      expect(hasNode).toBeTruthy();
    });

    it("should return false if the node does not exist", () => {
      // Execute
      const hasNode = manager.hasNode(mockVSCodeUri("/other.ink"));

      // Assert
      expect(hasNode).toBeFalsy();
    });
  });

  describe("hasReverseDependency()", () => {
    it("should return the reverse dependencies of a given URI", () => {
      // Setup
      const storyUri = mockVSCodeUri("/story.ink");
      const depUri = mockVSCodeUri("/dep.ink");
      const otherUri = mockVSCodeUri("/other.ink");
      manager.addDependency(storyUri, depUri);

      // Assert
      expect(manager.hasReverseDependency(depUri, storyUri)).toBe(true);
      expect(manager.hasReverseDependency(storyUri, depUri)).toBe(false); // Wrong direction
      expect(manager.hasReverseDependency(otherUri, storyUri)).toBe(false);
    });
  });

  describe("removeDependency()", () => {
    it("should remove a dependency between two nodes", () => {
      // Setup
      const storyUri = mockVSCodeUri("/story.ink");
      const depUri = mockVSCodeUri("/dep.ink");
      manager.addDependency(storyUri, depUri);
      expect(manager.hasDependency(storyUri, depUri)).toBe(true);

      // Execute
      manager.removeDependency(storyUri, depUri);

      // Assert
      expect(manager.hasDependency(storyUri, depUri)).toBe(false);
      expect(manager.hasReverseDependency(depUri, storyUri)).toBe(false);
    });
  });

  describe("updateDependencies()", () => {
    it("should update dependencies for a node", () => {
      // Setup
      const storyUri = mockVSCodeUri("/story.ink");
      const dep1Uri = mockVSCodeUri("/dep1.ink");
      const dep2Uri = mockVSCodeUri("/dep2.ink");
      const dep3Uri = mockVSCodeUri("/dep3.ink");
      manager.addDependency(storyUri, dep1Uri);

      const newDeps = new Map<vscode.Uri, vscode.Uri[]>();
      newDeps.set(storyUri, [dep2Uri, dep3Uri]);

      // Execute
      manager.updateDependencies(newDeps);

      // Assert
      const deps = manager.getDependencies(storyUri);
      expect(deps.size).toBe(2);
      expect(manager.hasDependency(storyUri, dep1Uri)).toBe(false);
      expect(manager.hasDependency(storyUri, dep2Uri)).toBe(true);
      expect(manager.hasDependency(storyUri, dep3Uri)).toBe(true);
    });
  });
});
