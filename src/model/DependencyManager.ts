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
import { DependencyNode, DependencyNodeType } from "./DependencyNode";

/**
 * Singleton which manages the Dependency Graph.
 */
export class DependencyManager {
  // Private Static Properties ========================================================================================

  private static instance: DependencyManager;

  // Public Static Methods ============================================================================================

  /**
   * Gets the singleton instance of the `DependencyManager`.
   * @returns The singleton instance.
   */
  public static getInstance(): DependencyManager {
    if (!DependencyManager.instance) {
      DependencyManager.instance = new DependencyManager();
    }
    return DependencyManager.instance;
  }

  // Private Properties ===============================================================================================

  private nodes: Map<string, DependencyNode> = new Map();
  private dependencies: Map<string, Set<string>> = new Map();
  private reverseDependencies: Map<string, Set<string>> = new Map();

  // Constructor ======================================================================================================

  private constructor() {}

  // Private Methods ==================================================================================================

  /**
   * Adds a new node to the graph's internal collections.
   * If a node with the same URI already exists, this method does nothing.
   * @param uri The URI of the node to add.
   * @param node The `DependencyNode` object to add.
   */
  private addNode(uri: vscode.Uri, node: DependencyNode) {
    const uriString = uri.toString();
    if (this.nodes.has(uriString)) {
      return;
    }
    this.nodes.set(uriString, node);
    this.dependencies.set(uriString, new Set());
    this.reverseDependencies.set(uriString, new Set());
  }

  /**
   * Retrieves all node URIs currently in the graph.
   * @returns An array of `vscode.Uri` for all nodes.
   */
  private findAllNodeUris(): vscode.Uri[] {
    return Array.from(this.nodes.keys()).map((u) => vscode.Uri.parse(u));
  }

  /**
   * Finds the direct dependencies for a given URI.
   * @param uri The URI to find dependencies for.
   * @returns A set of dependency URIs.
   */
  private findDependencies(uri: vscode.Uri): Set<vscode.Uri> {
    const uriString = uri.toString();
    const depsStrings = this.dependencies.get(uriString) ?? new Set();
    const depsUris = new Set<vscode.Uri>();
    for (const s of depsStrings) {
      depsUris.add(vscode.Uri.parse(s));
    }
    return depsUris;
  }

  /**
   * Finds a node in the graph by its URI.
   * @param uri The URI of the node to find.
   * @returns The `DependencyNode` if found, otherwise `undefined`.
   */
  private findNode(uri: vscode.Uri): DependencyNode | undefined {
    const uriString = uri.toString();
    return this.nodes.get(uriString);
  }

  /**
   * Finds the direct reverse dependencies for a given URI.
   * @param uri The URI to find reverse dependencies for.
   * @returns A set of reverse dependency URIs.
   */
  private findReverseDependencies(uri: vscode.Uri): Set<vscode.Uri> {
    const uriString = uri.toString();
    const revDepsStrings = this.reverseDependencies.get(uriString) ?? new Set();
    const revDepsUris = new Set<vscode.Uri>();
    for (const s of revDepsStrings) {
      revDepsUris.add(vscode.Uri.parse(s));
    }
    return revDepsUris;
  }

  /**
   * Checks if a node is a root node (i.e., has no reverse dependencies).
   * @param uri The URI of the node to check.
   * @returns `true` if the node is a root, otherwise `false`.
   */
  private isRoot(uri: vscode.Uri): boolean {
    const revDeps = this.getReverseDependencies(uri);
    return revDeps.size === 0;
  }

  /**
   * Removes all outgoing dependency edges from a node.
   * This also updates the reverse dependency lists of the nodes it depended on.
   * @param uri The URI of the node whose dependencies should be removed.
   */
  private removeDependencies(uri: vscode.Uri) {
    const uriString = uri.toString();
    const deps = this.dependencies.get(uriString) ?? new Set();
    for (const dep of deps) {
      this.reverseDependencies.get(dep)?.delete(uriString);
    }
    this.dependencies.delete(uriString);
  }

  /**
   * Removes a dependency edge between two nodes.
   * @param from The URI string of the dependent node.
   * @param to The URI string of the dependency node.
   */
  public removeDependency(from: vscode.Uri, to: vscode.Uri) {
    const fromString = from.toString();
    const toString = to.toString();
    this.dependencies.get(fromString)?.delete(toString);
    this.reverseDependencies.get(toString)?.delete(fromString);
  }

  /**
   * Removes a node and its corresponding entries from all internal maps.
   * @param uri The URI of the node to remove.
   */
  private removeNode(uri: vscode.Uri) {
    const uriString = uri.toString();
    this.nodes.delete(uriString);
    this.dependencies.delete(uriString);
    this.reverseDependencies.delete(uriString);
  }

  /**
   * Determines the `DependencyNodeType` based on the file extension of a URI.
   * @param uri The URI to determine the node type for.
   * @returns The corresponding `DependencyNodeType`.
   * @throws An error if the file type is unsupported.
   */
  private toNodeTypes(uri: vscode.Uri): DependencyNodeType {
    if (uri.path.endsWith(".ink")) {
      return DependencyNodeType.story;
    } else if (uri.path.endsWith(".js")) {
      return DependencyNodeType.externalFunctions;
    }
    throw new Error(`Unsupported file type: ${uri.path}`);
  }

  /**
   * Traverses the graph (either dependencies or reverse dependencies) starting from a set of URIs.
   * @param startUris The URIs to begin traversal from.
   * @param edges The map of edges (dependencies or reverse dependencies) to traverse.
   * @returns A set of all unique URIs found during traversal.
   */
  private traverse(
    startUris: vscode.Uri[],
    edges: Map<string, Set<string>>
  ): Set<vscode.Uri> {
    const allItems = new Set<vscode.Uri>();
    const toVisit = [...startUris];
    const visited = new Set<string>(startUris.map((u) => u.toString()));

    while (toVisit.length > 0) {
      const currentUri = toVisit.shift()!;
      const uriString = currentUri.toString();

      const directConnections = edges.get(uriString) ?? new Set();
      for (const connString of directConnections) {
        if (!visited.has(connString)) {
          visited.add(connString);
          const connUri = vscode.Uri.parse(connString);
          allItems.add(connUri);
          toVisit.push(connUri);
        }
      }
    }
    return allItems;
  }

  private syncDependencies(uri: vscode.Uri, newDepsUris: vscode.Uri[]) {
    const oldDeps = this.getDependencies(uri);
    const newDeps = new Set(newDepsUris);

    // Find dependencies to remove
    for (const oldDep of oldDeps) {
      if (!newDeps.has(oldDep)) {
        this.removeDependency(uri, oldDep);
      }
    }

    // Find dependencies to add
    for (const newDep of newDeps) {
      this.createNode(newDep);
      if (!oldDeps.has(newDep)) {
        this.addDependency(uri, newDep);
      }
    }
  }

  // Public Methods ===================================================================================================

  /**
   * Adds a dependency edge between two nodes.
   * @param from The URI string of the dependent node.
   * @param to The URI string of the dependency node.
   */
  public addDependency(from: vscode.Uri, to: vscode.Uri) {
    this.createNode(from);
    this.createNode(to);

    const fromString = from.toString();
    const toString = to.toString();

    this.dependencies.get(fromString)?.add(toString);
    this.reverseDependencies.get(toString)?.add(fromString);
  }

  /**
   * Clears the entire dependency graph, removing all nodes and edges.
   */
  public clear(): void {
    this.nodes.clear();
    this.dependencies.clear();
    this.reverseDependencies.clear();
  }

  /**
   * Gets or creates a dependency node in the graph.
   * If the node already exists, its version is updated.
   * @param uri The URI of the node.
   * @param version The version of the document associated with the node. Defaults to 0.
   * @returns The existing or newly created `DependencyNode`.
   */
  public createNode(uri: vscode.Uri, version: number = 0): DependencyNode {
    let node = this.findNode(uri);
    if (!node) {
      const nodeType = this.toNodeTypes(uri);
      const nodeVersion = version ?? 0;
      node = new DependencyNode(uri, nodeVersion, nodeType);
      this.addNode(uri, node);
    }
    // Update the version if provided
    if (version !== undefined) {
      node.version = version;
    }
    return node;
  }

  /**
   * Deletes a node and all its associated edges from the graph.
   * @param uri The URI of the node to delete.
   */
  public deleteNode(uri: vscode.Uri): void {
    const node = this.findNode(uri);
    if (!node) {
      return;
    }

    // Remove this node from the revDeps of its dependencies
    this.removeReverseDependencies(uri);

    // Remove this node from the deps of its reverse dependencies
    this.removeDependencies(uri);

    // Remove the node and its edge sets
    this.removeNode(uri);
  }

  /**
   * Dumps the current state of the dependency graph to the console for debugging.
   */
  public dumpGraph(): void {
    let output = "";
    output += "--- Dependency Graph ---\n";
    if (this.nodes.size === 0) {
      output += "Graph is empty.\n";
      output += "------------------------\n";
      return;
    }

    for (const uriString of this.nodes.keys()) {
      const node = this.nodes.get(uriString)!;
      output += `Node: ${node.uri.fsPath}\n`;
      output += `  Type: ${node.type}\n`;
      output += `  Version: ${node.version}\n`;

      const deps = this.dependencies.get(uriString) ?? new Set();
      if (deps.size > 0) {
        output += "  Dependencies:\n";
        for (const dep of deps) {
          output += `    - ${vscode.Uri.parse(dep).fsPath}\n`;
        }
      } else {
        output += "  Dependencies: None\n";
      }

      const revDeps = this.reverseDependencies.get(uriString) ?? new Set();
      if (revDeps.size > 0) {
        output += "  Referenced by:\n";
        for (const revDep of revDeps) {
          output += `    - ${vscode.Uri.parse(revDep).fsPath}\n`;
        }
      } else {
        output += "  Referenced by: None\n";
      }
      output += "\n"; // for spacing
    }
    output += "------------------------\n";
    console.log(output);
  }

  /**
   * Recursively gets all unique dependencies for a set of starting URIs.
   * @param startUris An array of URIs to start the traversal from.
   * @returns A set of all unique dependency URIs.
   */
  public getAllDependencies(startUris: vscode.Uri[]): Set<vscode.Uri> {
    return this.traverse(startUris, this.dependencies);
  }

  /**
   * Recursively gets all unique dependents for a set of starting URIs.
   * @param startUris An array of URIs to start the traversal from.
   * @returns A set of all unique dependent URIs.
   */
  public getAllDependents(startUris: vscode.Uri[]): Set<vscode.Uri> {
    return this.traverse(startUris, this.reverseDependencies);
  }

  /**
   * Gets all root nodes in the graph (i.e., nodes with no reverse dependencies).
   * @returns A set of URI strings for all root nodes.
   */
  public getAllRoots(): Set<vscode.Uri> {
    const roots = new Set<vscode.Uri>();
    for (const uri of this.findAllNodeUris()) {
      if (this.isRoot(uri)) {
        roots.add(uri);
      }
    }
    return roots;
  }

  /**
   * Gets the direct dependencies for a given URI.
   * @param uri The URI to get dependencies for.
   * @returns A readonly set of dependency URIs.
   */
  public getDependencies(uri: vscode.Uri): ReadonlySet<vscode.Uri> {
    return this.findDependencies(uri);
  }

  /**
   * Gets a dependency node from the graph.
   * @param uri The URI of the node to retrieve.
   * @returns The `DependencyNode` if it exists, otherwise `undefined`.
   */
  public getNode(uri: vscode.Uri): DependencyNode | undefined {
    return this.findNode(uri);
  }

  /**
   * Gets the direct reverse dependencies for a given URI.
   * @param uri The URI to get reverse dependencies for.
   * @returns A readonly set of reverse dependency URIs.
   */
  public getReverseDependencies(uri: vscode.Uri): ReadonlySet<vscode.Uri> {
    return this.findReverseDependencies(uri);
  }

  /**
   * Checks if a direct dependency relationship exists between two URIs.
   * @param from The potential dependent URI.
   * @param to The potential dependency URI.
   * @returns `true` if `from` directly depends on `to`, otherwise `false`.
   */
  public hasDependency(from: vscode.Uri, to: vscode.Uri): boolean {
    const fromString = from.toString();
    const toString = to.toString();
    return this.dependencies.get(fromString)?.has(toString) ?? false;
  }

  /**
   * Checks if a node exists in the graph.
   * @param uri The URI of the node to check.
   * @returns `true` if the node exists, otherwise `false`.
   */
  public hasNode(uri: vscode.Uri): boolean {
    return this.findNode(uri) !== undefined;
  }

  /**
   * Checks if a direct reverse dependency relationship exists between two URIs.
   * @param from The potential dependency URI.
   * @param to The potential dependent URI.
   * @returns `true` if `to` is a direct reverse dependency of `from`, otherwise `false`.
   */
  public hasReverseDependency(from: vscode.Uri, to: vscode.Uri): boolean {
    const fromString = from.toString();
    const toString = to.toString();
    return this.reverseDependencies.get(fromString)?.has(toString) ?? false;
  }

  /**
   * Removes all incoming reverse dependency edges for a node.
   * This also updates the dependency lists of the nodes that depend on it.
   * @param uri The URI of the node whose reverse dependencies should be removed.
   */
  public removeReverseDependencies(uri: vscode.Uri) {
    const uriString = uri.toString();
    const revDeps = this.reverseDependencies.get(uriString) ?? new Set();
    for (const revDep of revDeps) {
      this.dependencies.get(revDep)?.delete(uriString);
    }
    this.reverseDependencies.delete(uriString);
  }

  /**
   * Updates the dependencies for a given URI, adding and removing edges as needed.
   * @param uri The URI whose dependencies are to be updated.
   * @param newDepsUris An array of URIs representing the new set of dependencies.
   */
  public updateDependencies(dependencies: Map<vscode.Uri, vscode.Uri[]>) {
    for (const [uri, deps] of dependencies) {
      this.syncDependencies(uri, deps);
    }
  }
}
