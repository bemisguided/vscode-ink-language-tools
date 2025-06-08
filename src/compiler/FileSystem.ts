import * as vscode from "vscode";
import * as path from "path";
import * as fs from "fs";

/**
 * Utility class for file system operations in the VSCode extension.
 * Provides centralized access to file reading, watching, and path resolution.
 */
export class FileSystem {
  // Public Methods ===================================================================================================

  /**
   * Reads the contents of a file asynchronously.
   * @param filePath - The path to the file to read
   * @returns The file contents as a string, or null if reading fails
   */
  public static async readFile(filePath: string): Promise<string> {
    return await fs.promises.readFile(filePath, "utf8");
  }

  /**
   * Checks if a file exists at the specified path.
   * @param filePath - The path to check
   * @returns True if the file exists, false otherwise
   */
  public static async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.promises.access(filePath, fs.constants.F_OK);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Sets up a file watcher for the specified file.
   * @param filePath - The path of the file to watch
   * @param callback - Function to call when the file changes
   * @returns A disposable object that can be used to stop watching
   */
  public static watchFile(
    filePath: string,
    callback: (path: string) => void
  ): vscode.Disposable {
    const watcher = fs.watch(filePath, (eventType) => {
      if (eventType === "change") {
        callback(filePath);
      }
    });

    return {
      dispose: () => watcher.close(),
    };
  }

  /**
   * Gets the workspace root directory for a given file.
   * @param filePath - The path of a file in the workspace
   * @returns The absolute path to the workspace root
   * @throws Error if no workspace is found for the file
   */
  public static getWorkspaceRoot(filePath: string): string {
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(
      vscode.Uri.file(filePath)
    );
    if (!workspaceFolder) {
      throw new Error(`No workspace folder found for ${filePath}`);
    }
    return workspaceFolder.uri.fsPath;
  }

  /**
   * Resolves a relative path against a base directory.
   * @param baseDir - The base directory to resolve against
   * @param relativePath - The relative path to resolve
   * @returns The absolute path
   */
  public static resolvePath(baseDir: string, relativePath: string): string {
    return path.resolve(baseDir, relativePath);
  }
}
