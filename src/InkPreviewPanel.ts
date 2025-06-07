import * as vscode from "vscode";
import { Story } from "inkjs/engine/Story";
import path from "path";

export class InkPreviewPanel {
  public static currentPanel: InkPreviewPanel | undefined;
  private readonly _panel: vscode.WebviewPanel;
  private readonly _extensionUri: vscode.Uri;
  private _disposables: vscode.Disposable[] = [];
  private _story: Story | undefined;
  private _storyData: any = null;
  private _currentFileName: string = "";
  private _processingChoice: boolean = false;
  private _storyLoaded: boolean = false;
  private _webviewInitialized: boolean = false;

  public static createOrShow(extensionUri: vscode.Uri) {
    const column = vscode.window.activeTextEditor
      ? vscode.ViewColumn.Beside
      : undefined;

    // If we already have a panel, show it
    if (InkPreviewPanel.currentPanel) {
      InkPreviewPanel.currentPanel._panel.reveal(column);
      return;
    }

    // Otherwise, create a new panel
    const panel = vscode.window.createWebviewPanel(
      "inkPreview",
      "Ink Story Preview",
      column || vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(extensionUri, "media"),
          vscode.Uri.joinPath(extensionUri, "out"),
        ],
      }
    );

    InkPreviewPanel.currentPanel = new InkPreviewPanel(panel, extensionUri);
  }

  public static revive(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    InkPreviewPanel.currentPanel = new InkPreviewPanel(panel, extensionUri);
  }

  private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
    this._panel = panel;
    this._extensionUri = extensionUri;

    // Set the webview's initial html content
    this._update();

    // Listen for when the panel is disposed
    // This happens when the user closes the panel or when the panel is closed programmatically
    this._panel.onDidDispose(() => this.dispose(), null, this._disposables);

    // Update the content based on view changes
    // NOTE: We don't need to regenerate HTML on every view state change
    // The webview content is dynamic and updates via messages
    this._panel.onDidChangeViewState(
      (e) => {
        // Only update if the panel becomes visible and hasn't been initialized
        if (this._panel.visible && !this._webviewInitialized) {
          this._update();
        }
      },
      null,
      this._disposables
    );

    // Handle messages from the webview
    this._panel.webview.onDidReceiveMessage(
      (message) => {
        console.log("📨 Webview message received:", message.command);
        switch (message.command) {
          case "makeChoice":
            console.log("📨 Received makeChoice message:", message.choiceIndex);
            this._handleChoice(message.choiceIndex);
            return;
          case "restart":
            this._restartStory();
            return;
          case "ready":
            // Webview is ready, send initial story if we have one
            console.log(
              "📨 Webview ready message received, story loaded:",
              this._storyLoaded
            );
            if (this._storyData && !this._storyLoaded) {
              console.log("🎬 Loading story for first time");
              this._loadStoryData(this._storyData);
            }
            return;

          default:
            console.log("📨 Unknown message command:", message.command);
        }
      },
      null,
      this._disposables
    );
  }

  public loadStory(jsonData: string, fileName?: string) {
    console.log(
      "📖 InkPreviewPanel.loadStory called with data length:",
      jsonData.length
    );

    // Reset story loaded flag when loading new story
    this._storyLoaded = false;

    if (fileName) {
      this._currentFileName = fileName;
      this._updateTitle();
    }

    try {
      this._storyData = JSON.parse(jsonData);
      console.log("✅ Story data parsed successfully");
      this._loadStoryData(this._storyData);
    } catch (error) {
      console.error("❌ Failed to parse story JSON:", error);
      vscode.window.showErrorMessage(`Failed to load story: ${error}`);
    }
  }

  private _loadStoryData(storyData: any) {
    console.log("🎮 Loading story data into Story object...");

    // Clear previous story content first
    this._panel.webview.postMessage({
      command: "clearStory",
    });

    try {
      this._story = new Story(storyData);
      this._storyLoaded = true; // Mark story as loaded
      console.log("✅ Story object created successfully");
      this._updateStoryDisplay();
    } catch (error) {
      console.error("❌ Failed to initialize Story object:", error);
      this._panel.webview.postMessage({
        command: "showError",
        error: `Failed to initialize story: ${error}`,
      });
    }
  }

  private _handleChoice(choiceIndex: number) {
    if (!this._story) {
      console.log("⚠️ No story object available for choice handling");
      return;
    }

    if (this._processingChoice) {
      console.log("⚠️ Already processing a choice, ignoring duplicate");
      return;
    }

    this._processingChoice = true;

    try {
      console.log(
        "🎯 Making choice:",
        choiceIndex,
        "Available choices:",
        this._story.currentChoices.length
      );

      // Validate choice index
      if (choiceIndex < 0 || choiceIndex >= this._story.currentChoices.length) {
        console.error("❌ Invalid choice index:", choiceIndex);
        this._processingChoice = false;
        return;
      }

      this._story.ChooseChoiceIndex(choiceIndex);
      console.log("✅ Choice made successfully, updating display");
      this._updateStoryDisplay();
    } catch (error) {
      console.error("❌ Error making choice:", error);
      this._panel.webview.postMessage({
        command: "showError",
        error: `Error making choice: ${error}`,
      });
    } finally {
      // Reset processing flag after a short delay
      setTimeout(() => {
        this._processingChoice = false;
      }, 100);
    }
  }

  private _restartStory() {
    if (!this._storyData) {
      return;
    }

    // Clear previous content before restarting
    this._panel.webview.postMessage({
      command: "clearStory",
    });

    try {
      this._story = new Story(this._storyData);
      this._storyLoaded = true; // Mark as loaded after restart
      this._updateStoryDisplay();
    } catch (error) {
      this._panel.webview.postMessage({
        command: "showError",
        error: `Error restarting story: ${error}`,
      });
    }
  }

  private _updateStoryDisplay() {
    if (!this._story) {
      console.log("⚠️ No story object available for display");
      return;
    }

    try {
      console.log("🔄 Updating story display...");

      // Continue the story as far as we can
      let text = "";
      while (this._story.canContinue) {
        text += this._story.Continue();
      }

      // Get current tags (tags from the last piece of content)
      const currentTags = this._story.currentTags || [];

      // Get current choices
      console.log(
        "📋 Available story choices:",
        this._story.currentChoices.length
      );
      this._story.currentChoices.forEach((choice: any, idx: number) => {
        console.log(`  Choice ${idx}: "${choice.text}"`);
      });

      const choices = this._story.currentChoices.map(
        (choice: any, index: number) => ({
          index: index,
          text: choice.text,
          tags: choice.tags || [],
        })
      );

      // Check if story has ended
      const hasEnded = !this._story.canContinue && choices.length === 0;

      console.log(
        "📝 Story update - Text length:",
        text.length,
        "Choices:",
        choices.length,
        "Has ended:",
        hasEnded
      );

      // Send update to webview
      this._panel.webview.postMessage({
        command: "updateStory",
        text: text,
        tags: currentTags,
        choices: choices,
        hasEnded: hasEnded,
        // Future: This is where we'd include external function call info
        variables: this._getStoryVariables(),
      });
    } catch (error) {
      console.error("❌ Error in _updateStoryDisplay:", error);
      this._panel.webview.postMessage({
        command: "showError",
        error: `Error updating story: ${error}`,
      });
    }
  }

  private _getStoryVariables(): any {
    if (!this._story) {
      return {};
    }

    try {
      // Get some basic variable info for debugging
      const variables: any = {};

      // Future: We could expose more story state here
      // This would be useful for external function development

      return variables;
    } catch (error) {
      return {};
    }
  }

  public dispose() {
    InkPreviewPanel.currentPanel = undefined;
    this._webviewInitialized = false; // Reset initialization flag

    // Clean up our resources
    this._panel.dispose();

    while (this._disposables.length) {
      const x = this._disposables.pop();
      if (x) {
        x.dispose();
      }
    }
  }

  private _update() {
    const webview = this._panel.webview;
    this._updateTitle();
    this._panel.webview.html = this._getHtmlForWebview(webview);
    this._webviewInitialized = true;
    console.log("✅ Webview HTML updated and marked as initialized");
  }

  private _updateTitle() {
    if (this._currentFileName) {
      this._panel.title = `Ink Preview - ${path.basename(
        this._currentFileName
      )}`;
    } else {
      this._panel.title = "Ink Story Preview";
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    // Local path to main script run in the webview
    const scriptPath = vscode.Uri.joinPath(
      this._extensionUri,
      "media",
      "preview.js"
    );
    const styleMainPath = vscode.Uri.joinPath(
      this._extensionUri,
      "media",
      "preview.css"
    );

    // Convert to webview URIs
    const scriptUri = webview.asWebviewUri(scriptPath);
    const styleMainUri = webview.asWebviewUri(styleMainPath);

    // Use a nonce to only allow specific scripts to be run
    const nonce = this._getNonce();

    return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource}; script-src 'nonce-${nonce}'; img-src ${webview.cspSource};">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="${styleMainUri}" rel="stylesheet">
            <title>Ink Preview</title>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Story Preview</h1>
                    <div class="controls">
                        <button id="restart-btn" title="Restart Story">Restart</button>
                    </div>
                </div>
                
                <div id="story-container">
                    <div id="story-content">
                        <div class="waiting">
                          
                        </div>
                    </div>
                    
                    <div id="choices-container">
                        <!-- Choices will be populated here -->
                    </div>
                    
                    <div id="error-container" class="hidden">
                        <!-- Errors will be shown here -->
                    </div>
                </div>
                
                <!-- Future: External function debugging panel -->
                <div id="debug-container" class="hidden">
                    <h3>🔧 External Functions</h3>
                    <div id="function-calls">
                        <!-- Future: Show external function calls and allow stubbing -->
                    </div>
                </div>
            </div>
            
            <script nonce="${nonce}" src="${scriptUri}"></script>
        </body>
        </html>`;
  }

  private _getNonce() {
    let text = "";
    const possible =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (let i = 0; i < 32; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
}
