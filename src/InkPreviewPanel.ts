import * as vscode from "vscode";
import { Story } from "inkjs/engine/Story";
import * as path from "path";
import * as fs from "fs";

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
  private _mockFunctions: any = {};
  private _mockFilePath: string = "";
  private _functionCalls: Array<{
    functionName: string;
    args: any[];
    result: any;
    timestamp: number;
  }> = [];

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

  public loadStory(
    jsonData: string,
    fileName?: string,
    sourceContent?: string
  ) {
    console.log(
      "📖 InkPreviewPanel.loadStory called with data length:",
      jsonData.length
    );

    // Reset story loaded flag when loading new story
    this._storyLoaded = false;

    if (fileName) {
      this._currentFileName = fileName;
      this._updateTitle();

      // Parse mock directive if source content is provided
      if (sourceContent) {
        this._parseMockDirective(sourceContent, fileName);
      }
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

  private _parseMockDirective(sourceContent: string, inkFileName: string) {
    const lines = sourceContent.split("\n");
    const firstLine = lines[0]?.trim();

    if (firstLine && firstLine.startsWith("// MOCKS")) {
      const mockPath = firstLine.substring(8).trim(); // Remove "// MOCKS" prefix
      console.log(`🎭 Mock directive found: ${mockPath}`);

      try {
        this._loadMockFile(mockPath, inkFileName);
      } catch (error) {
        console.error(`❌ Failed to load mock file ${mockPath}:`, error);
        vscode.window.showWarningMessage(
          `Failed to load mock file: ${mockPath}`
        );
      }
    } else {
      // Clear any existing mocks
      this._mockFunctions = {};
      this._mockFilePath = "";
    }
  }

  private _loadMockFile(mockPath: string, inkFileName: string) {
    // Resolve mock file path relative to the ink file
    const inkFileDir = path.dirname(inkFileName);
    const mockFilePath = path.resolve(inkFileDir, mockPath);

    if (!fs.existsSync(mockFilePath)) {
      throw new Error(`Mock file not found: ${mockFilePath}`);
    }

    const mockContent = fs.readFileSync(mockFilePath, "utf-8");
    console.log(`📁 Loading mock file: ${mockFilePath}`);

    try {
      // Create a safe evaluation context
      const mockContext = this._createMockContext();

      // Execute mock content and capture function declarations
      // We need to extract function names first, then execute and capture them
      const functionNames = mockContent.match(
        /function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g
      );
      console.log(`🔍 Found function declarations:`, functionNames);

      if (functionNames) {
        // Create a wrapper that will execute the mock content and return the functions
        const funcNamesList = functionNames.map((match) =>
          match.replace(/function\s+/, "")
        );
        console.log(`🔍 Extracting functions:`, funcNamesList);

        const wrapper = `
          // Set up context
          var console = arguments[0];
          var Math = arguments[1];
          var Date = arguments[2];
          var JSON = arguments[3];
          var Object = arguments[4];
          var Array = arguments[5];
          var String = arguments[6];
          var Number = arguments[7];
          var Boolean = arguments[8];
          
          // Execute the mock content
          ${mockContent}
          
          // Return an object with all the functions
          return {
            ${funcNamesList
              .map(
                (name) =>
                  `${name}: typeof ${name} !== 'undefined' ? ${name} : null`
              )
              .join(",\n")}
          };
        `;

        const extractorFunc = new Function(wrapper);
        const extractedFunctions = extractorFunc(...Object.values(mockContext));

        // Filter out null functions and store the valid ones
        this._mockFunctions = {};
        for (const [name, func] of Object.entries(extractedFunctions as any)) {
          if (func && typeof func === "function") {
            this._mockFunctions[name] = func as (...args: any[]) => any;
          }
        }
      } else {
        // Fallback to old method if no functions found
        this._extractMockFunctions(mockContext);
      }
      this._mockFilePath = mockFilePath;

      console.log(
        `✅ Mock file loaded successfully. Functions available:`,
        Object.keys(this._mockFunctions)
      );
    } catch (error) {
      throw new Error(`Error executing mock file: ${error}`);
    }
  }

  private _createMockContext() {
    // Create a sandbox context for executing mock JavaScript
    const context: any = {
      console: console,
      // Add other safe globals as needed
      Math: Math,
      Date: Date,
      JSON: JSON,
      Object: Object,
      Array: Array,
      String: String,
      Number: Number,
      Boolean: Boolean,
    };
    return context;
  }

  private _extractMockFunctions(context: any) {
    this._mockFunctions = {};

    // The current approach doesn't work because function declarations
    // don't get attached to the context object. We need a different approach.
    // This method is now called after executing the mock content, but
    // the functions are not accessible through the context.

    // For now, log that we couldn't extract functions this way
    console.log(
      "⚠️ _extractMockFunctions: Current method cannot capture function declarations"
    );

    // Find all functions in the context (this will only find built-in types)
    for (const key in context) {
      if (typeof context[key] === "function" && !key.startsWith("_")) {
        console.log(`🔍 Found context function: ${key}`);
        // Don't add built-in types to mock functions
        if (
          ![
            "Date",
            "Object",
            "Array",
            "String",
            "Number",
            "Boolean",
            "console",
            "Math",
            "JSON",
          ].includes(key)
        ) {
          this._mockFunctions[key] = context[key];
        }
      }
    }
  }

  private _loadStoryData(storyData: any) {
    console.log("🎮 Loading story data into Story object...");

    // Clear function calls history when loading new story
    this._functionCalls = [];

    // Clear previous story content first
    this._panel.webview.postMessage({
      command: "clearStory",
    });

    try {
      this._story = new Story(storyData);

      // Bind external functions if available
      this._bindExternalFunctions();

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

  private _bindExternalFunctions() {
    if (!this._story || Object.keys(this._mockFunctions).length === 0) {
      return;
    }

    console.log(
      "🔗 Binding external functions:",
      Object.keys(this._mockFunctions)
    );

    // Bind each mock function to the story
    for (const functionName in this._mockFunctions) {
      const mockFunction = this._mockFunctions[functionName];

      this._story.BindExternalFunction(functionName, (...args: any[]) => {
        try {
          console.log(
            `🎭 Calling external function: ${functionName}(${args.join(", ")})`
          );
          const result = mockFunction(...args);
          console.log(`🎭 Function ${functionName} returned:`, result);

          // Record the function call for display in preview
          this._functionCalls.push({
            functionName: functionName,
            args: args,
            result: result,
            timestamp: Date.now(),
          });

          return result;
        } catch (error) {
          console.error(
            `❌ Error in external function ${functionName}:`,
            error
          );

          // Record the error as well
          this._functionCalls.push({
            functionName: functionName,
            args: args,
            result: `ERROR: ${error}`,
            timestamp: Date.now(),
          });

          return null;
        }
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

    // Clear function calls history
    this._functionCalls = [];

    // Clear previous content before restarting
    this._panel.webview.postMessage({
      command: "clearStory",
    });

    try {
      this._story = new Story(this._storyData);

      // Re-bind external functions
      this._bindExternalFunctions();

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

      // Continue the story as far as we can, collecting tags for each line
      let text = "";
      let allTags: string[] = [];
      while (this._story.canContinue) {
        const lineText = this._story.Continue();
        if (lineText) {
          text += lineText;

          // Collect tags from each line
          const lineTags = this._story.currentTags || [];
          if (lineTags.length > 0) {
            console.log(
              `🏷️ Line tags found: ${lineTags.join(
                ", "
              )} for text: "${lineText.trim()}"`
            );
            allTags = allTags.concat(lineTags);
          }
        }
      }

      // Use all collected tags, removing duplicates
      const currentTags = [...new Set(allTags)];
      console.log("🏷️ All collected tags:", currentTags);

      // Get current choices
      console.log(
        "📋 Available story choices:",
        this._story.currentChoices.length
      );
      this._story.currentChoices.forEach((choice: any, idx: number) => {
        console.log(
          `  Choice ${idx}: "${choice.text}" tags: ${choice.tags || []}`
        );
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
        functionCalls: this._functionCalls,
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
