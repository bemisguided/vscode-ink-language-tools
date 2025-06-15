import * as vscode from "vscode";

export interface VSCodeDocumentService {
  resolvePath(baseUri: vscode.Uri, path: string): vscode.Uri | null;
  exists(baseUri: vscode.Uri, path: string): Promise<boolean>;
  getTextDocument(
    baseUri: vscode.Uri,
    path?: string
  ): Promise<vscode.TextDocument>;
  tryGetTextDocument(
    baseUri: vscode.Uri,
    path?: string
  ): Promise<vscode.TextDocument | undefined>;
}

export class VSCodeDocumentServiceImpl implements VSCodeDocumentService {
  /**
   * Resolve a URI based on a base URI and a path.
   * - If path starts with "/", it's treated as workspace-rooted.
   * - Otherwise, it's relative to baseUri.
   */
  public resolvePath(baseUri: vscode.Uri, path: string): vscode.Uri | null {
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
  public async exists(baseUri: vscode.Uri, path: string): Promise<boolean> {
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
  public async getTextDocument(
    baseUri: vscode.Uri,
    path?: string
  ): Promise<vscode.TextDocument> {
    const doc = await this.tryGetTextDocument(baseUri, path);
    if (!doc) {
      throw new Error(`Failed to open document at "${baseUri.toString()}`);
    }
    return doc;
  }

  /**
   * Attempts to return the TextDocument at the resolved URI.
   * Returns undefined if the file does not exist or can't be opened.
   */
  public async tryGetTextDocument(
    baseUri: vscode.Uri,
    path?: string
  ): Promise<vscode.TextDocument | undefined> {
    let resolvedUri: vscode.Uri;
    if (!path) {
      resolvedUri = baseUri;
    } else {
      const maybeUri = this.resolvePath(baseUri, path);
      if (!maybeUri) {
        return undefined;
      }
      resolvedUri = maybeUri;
    }
    try {
      return await vscode.workspace.openTextDocument(resolvedUri);
    } catch {
      return undefined;
    }
  }
}
