/**
 * Tracks dependencies between files in the compilation pipeline.
 * Maintains a graph of file dependencies to support incremental compilation.
 */
export class DependencyTracker {
  // Private Properties ===============================================================================================

  private dependencies: Map<string, Set<string>> = new Map();

  // Public Methods ===================================================================================================

  /**
   * Tracks dependencies between files.
   * @param file - The file that has dependencies
   * @param dependencies - Array of files that the main file depends on
   */
  public trackDependencies(file: string, dependencies: string[]): void {
    this.dependencies.set(file, new Set(dependencies));
  }

  /**
   * Gets all files that depend on a given file.
   * @param file - The file to check for dependents
   * @returns Array of files that depend on the given file
   */
  public getDependentFiles(file: string): string[] {
    const dependents: string[] = [];

    for (const [dependent, deps] of this.dependencies.entries()) {
      if (deps.has(file)) {
        dependents.push(dependent);
      }
    }

    return dependents;
  }

  /**
   * Clears all dependencies for a file.
   * @param file - The file to clear dependencies for
   */
  public clearDependencies(file: string): void {
    this.dependencies.delete(file);
  }

  /**
   * Gets all dependencies for a file.
   * @param file - The file to get dependencies for
   * @returns Array of files that the given file depends on
   */
  public getDependencies(file: string): string[] {
    return Array.from(this.dependencies.get(file) || []);
  }
}
