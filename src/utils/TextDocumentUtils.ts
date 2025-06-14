import * as vscode from "vscode";

export class TextDocumentUtils {
  /**
   * Resolve a URI based on a base URI and a path.
   * - If path starts with "/", it's treated as workspace-rooted.
   * - Otherwise, it's relative to baseUri.
   */
  public static resolvePath(
    baseUri: vscode.Uri,
    path: string
  ): vscode.Uri | null {
    if (path.startsWith("/")) {
      const workspaceFolder = vscode.workspace.getWorkspaceFolder(baseUri);
      if (!workspaceFolder) {
        return null;
      }
      return vscode.Uri.joinPath(
        workspaceFolder.uri,
        ...path.slice(1).split("/")
      );
    } else {
      return vscode.Uri.joinPath(baseUri, "..", ...path.split("/"));
    }
  }

  /**
   * Checks whether a document at the resolved path exists in the workspace file system.
   */
  public static async exists(
    baseUri: vscode.Uri,
    path: string
  ): Promise<boolean> {
    const resolvedUri = this.resolvePath(baseUri, path);
    if (!resolvedUri) {
      return false;
    }

    try {
      await vscode.workspace.fs.stat(resolvedUri);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Returns the TextDocument at the resolved URI.
   * Throws an error if the file does not exist or can't be opened.
   */
  public static async getTextDocument(
    baseUri: vscode.Uri,
    path: string
  ): Promise<vscode.TextDocument> {
    const resolvedUri = this.resolvePath(baseUri, path);
    if (!resolvedUri) {
      throw new Error(
        `Failed to resolve path "${path}" from base URI "${baseUri.toString()}"`
      );
    }

    try {
      return await vscode.workspace.openTextDocument(resolvedUri);
    } catch (err) {
      throw new Error(
        `Failed to open document at "${resolvedUri.toString()}": ${err}`
      );
    }
  }

  /**
   * Attempts to return the TextDocument at the resolved URI.
   * Returns undefined if the file does not exist or can't be opened.
   */
  public static async tryGetTextDocument(
    baseUri: vscode.Uri,
    path: string
  ): Promise<vscode.TextDocument | undefined> {
    const resolvedUri = this.resolvePath(baseUri, path);
    if (!resolvedUri) {
      return undefined;
    }

    try {
      return await vscode.workspace.openTextDocument(resolvedUri);
    } catch {
      return undefined;
    }
  }
}
