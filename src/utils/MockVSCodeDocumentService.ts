import * as vscode from "vscode";
import { VSCodeDocumentService } from "./VSCodeDocumentService";

export class MockVSCodeDocumentService implements VSCodeDocumentService {
  private docs = new Map<string, vscode.TextDocument>();

  // Add or override a mock document for a given URI
  mockTextDocument(uri: vscode.Uri, document?: vscode.TextDocument): void {
    if (!document) {
      document = {
        uri,
        fileName: uri.fsPath,
        isUntitled: false,
        languageId: "ink",
        version: 1,
        isDirty: false,
        isClosed: false,
        save: jest.fn(),
        eol: 1,
        lineCount: 1,
        lineAt: jest.fn(),
        offsetAt: jest.fn(),
        positionAt: jest.fn(),
        getText: () => "",
        getWordRangeAtPosition: jest.fn(),
        validateRange: jest.fn(),
        validatePosition: jest.fn(),
        encoding: "utf8",
      } as unknown as vscode.TextDocument;
    }
    this.docs.set(uri.toString(), document);
  }

  resolvePath = (baseUri: vscode.Uri, path: string): vscode.Uri | null =>
    vscode.Uri.file(path.startsWith("/") ? path : `/${path}`);

  exists = async (baseUri: vscode.Uri, path?: string): Promise<boolean> => {
    let uri: vscode.Uri;
    if (!path) {
      uri = baseUri;
    } else {
      uri = vscode.Uri.file(path.startsWith("/") ? path : `/${path}`);
    }
    return this.docs.has(uri.toString());
  };

  getTextDocument = async (
    baseUri: vscode.Uri,
    path?: string
  ): Promise<vscode.TextDocument> => {
    let uri: vscode.Uri;
    if (!path) {
      uri = baseUri;
    } else {
      uri = vscode.Uri.file(path.startsWith("/") ? path : `/${path}`);
    }
    const doc = this.docs.get(uri.toString());
    if (!doc) {
      throw new Error(`Mock document not found for ${uri.toString()}`);
    }
    return doc;
  };

  tryGetTextDocument = async (
    baseUri: vscode.Uri,
    path?: string
  ): Promise<vscode.TextDocument | undefined> => {
    let uri: vscode.Uri;
    if (!path) {
      uri = baseUri;
    } else {
      uri = vscode.Uri.file(path.startsWith("/") ? path : `/${path}`);
    }
    return this.docs.get(uri.toString());
  };
}
