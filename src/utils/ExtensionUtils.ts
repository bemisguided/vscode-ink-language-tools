import * as vscode from "vscode";
import * as path from "path";

const EXTENSION_ID = "bemisguided.vscode-ink-language-tools";

const MEDIA_PATH = "media";

export class ExtensionUtils {

  // Public Static Methods ============================================================================================

  // Extension Information
  public static getExtensionUri(): vscode.Uri {
    const extension = vscode.extensions.getExtension(EXTENSION_ID);
    if (!extension) {
      throw new Error(`Extension ${EXTENSION_ID} not found`);
    }
    return extension.extensionUri;
  }

  public static getExtensionPath(): string {
    return this.getExtensionUri().fsPath;
  }

  // Webview URIs
  public static getWebviewURL(
    webview: vscode.Webview,
    resourcePath: string
  ): vscode.Uri {
    const uri = vscode.Uri.file(
      path.join(this.getExtensionPath(), resourcePath)
    );
    return webview.asWebviewUri(uri);
  }

  public static getWebviewMediaURL(
    webview: vscode.Webview,
    fileName: string
  ): vscode.Uri {
    return this.getWebviewURL(webview, path.join(MEDIA_PATH, fileName));
  }

  public static getWebviewLocalResourceRoots(): vscode.Uri[] {
    return [vscode.Uri.file(path.join(this.getExtensionPath(), MEDIA_PATH))];
  }
}
