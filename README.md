# Ink Language Tools for Visual Studio Code

An unofficial Visual Studio Code Extension offering advanced language support for [Inkle's Ink](https://www.inklestudios.com/ink/) interactive fiction scripting language.

## Features
This extension currently offers the following features:

- **Syntax Highlighting**  
  Comprehensive syntax highlighting for all Ink language constructs, including knots, stitches, choices, variables, lists, functions, and more.

- **Document Outline Integration**  
  Quickly navigate your Ink story structure with Visual Studio Code's Outline view, showing knots, stitches, functions, and other key elements.

- **Inline Compilation and Error Presentation**  
  Automatic, real-time compilation of Ink files with error and warning diagnostics presented directly in the editor and the Problems panel.

- **Interactive Story Preview**  
  Play through your Ink Stories interactively within Visual Studio Code using a built-in story player.

- **External JavaScript Function Linking**  
  Link external JavaScript files to provide mock implementations of external functions for testing and previewing stories.

## Coming Soon
This extension is under active development with the following planned features:

- **IntelliSense**  
  Context-aware code completion and suggestions for Ink syntax, variables, and functions.

## Documentation

### Getting Started

1. Install the extension from the Visual Studio Code Marketplace
2. Open or create a file with the `.ink` extension
3. Begin writing your interactive story

> [!NOTE]
> There is no need to install the Ink compiler separately as this extension leverages [inkjs](https://github.com/y-lohse/inkjs), the JavaScript implementation of Ink, to compile Ink Stories in a platform-agnostic manner.

   
### Compiling Ink Stories

The extension provides robust, real-time compilation of your Ink Stories directly within Visual Studio Code, streamlining your development workflow.

#### Automatic Compilation

Files with the `.ink` extension are real-time compiled whenever they are saved or their content is updated. This ensures that you always have the most up-to-date feedback on your story's validity.

You can also manually trigger a compilation for the currently active Ink Story file by using the keyboard shortcut `Shift+Alt+K` (`Shift+Option+K` on macOS), right-clicking on any `.ink` file in the Explorer and selecting "Ink: Compile File", or by opening the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`) and selecting "Ink: Compile File".

#### Compilation Behavior

The extension provides the following settings to control the real-time compilation behavior:

-   **Debounce Wait**: The `ink.compile.behaviour.debounceWait` (default: `0`) setting controls the debounce wait time in milliseconds after an Ink Story is changed before triggering compilation.

-   **Advanced Path Resolution**: The `ink.compile.behaviour.advancedPathResolution` (default: `false`) setting controls how file paths in `INCLUDE` statements are resolved during compilation.

    **Default Behavior** (when disabled): All includes are resolved as relative paths of the main Ink Story file which is the default behavior of [Inky](https://github.com/inkle/inky).
    
    **Advanced Behavior** (when enabled): Supports both relative paths and workspace root paths. Paths starting with `/` are resolved relative to the source root, while all other paths are resolved relative to the main Ink Story file.

-   **Source Root**: The `ink.compile.behaviour.sourceRoot` (default: `""`) setting specifies the root directory for resolving absolute include paths. The path is relative to the workspace root. Leave empty to use the workspace root itself. This setting is only applicable when `ink.compile.behaviour.advancedPathResolution` is enabled.

#### Error Reporting

When compilation encounters issues, such as syntax errors or logic problems, these are reported in two ways:

-   **Problems Panel**: A comprehensive list of all errors and warnings will appear in Visual Studio Code's Problems panel, allowing you to quickly navigate to the source of each issue.
  
-   **In-Editor Highlighting**: The specific lines in your `.ink` files that contain errors or warnings will be highlighted, providing immediate visual feedback.

#### Document Outline

As your story is compiled, the extension generates a detailed outline, which is displayed in Visual Studio Code's Outline view. This outline provides a structured overview of your story, with direct links to the definitions of:

-   Knots, Stitches, and Labels
-   Included Files
-   Variables, Lists, and Constants
-   Functions and External Functions

#### Managing Compiled Output

By default, the extension compiles your story for analysis and error checking without creating any output files. However, you can configure it to emit the compiled Ink story in various formats.

-   **Enable JSON Output**: To enable writing the compiled JSON file, set the `ink.compile.output.enableEmitStoryJSON` (default: `false`) setting to `true`.

-   **Enable JavaScript Output**: To enable writing the compiled story as a JavaScript file, set the `ink.compile.output.enableEmitStoryJavaScript` (default: `false`) setting to `true`. This generates a `.js` file with the JSON content wrapped in a JavaScript variable declaration (`var storyContent = { ... };`), making it ready to use in web applications.
  
-   **Output Directory**: By default, compiled files are placed in an `out` folder in your workspace root. You can specify a different location by changing the `ink.compile.output.directory` (default: `out`) setting.
  
-   **Ignoring Included Files**: It is common to have Ink files that are meant to be included in other files and not compiled as standalone stories (e.g., `_character_definitions.ink`). By default, files starting with an underscore are not emitted as separate output files. You can customize this behavior with the `ink.compile.output.ignoreInkIncludes` (default: `**/_*.ink`) glob pattern setting.

#### Compilation Options

You can fine-tune the Ink compiler's behavior with the following setting:

-   **Count All Visits**: The `ink.compile.options.enableCountAllVisits` (default: `true`) setting is enabled by default. This corresponds to the Ink compiler option that tracks the visit count for all knots, stitches, etc. You can disable it if your story's logic requires it.   

### Previewing Ink Stories

The extension provides an interactive preview feature that allows you to play through your Ink Stories directly within Visual Studio Code.

#### Starting a Preview

You can start a preview by using the keyboard shortcut `Ctrl+R` (`Cmd+R` on macOS), right-clicking on any `.ink` file in the Explorer and selecting "Ink: Preview Story", or using the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`) and selecting "Ink: Preview Story".

The preview opens in a new panel alongside your editor, displaying your story's content and any available choices.

#### Navigation Controls

The preview supports both mouse and keyboard navigation for ease of use:

**Mouse Navigation:**
- Click on choice buttons to make selections
- Click the restart button in the toolbar to restart the story
- Click the rewind button in the toolbar to return to the last choice point

**Keyboard Navigation:**
- Use number keys (`1-9`) to select choices
- Press `Ctrl+R` (`Cmd+R` on macOS) to restart the story
- Press `Ctrl+Z` (`Cmd+Z` on macOS) to rewind to the last choice point

**Story Restart vs. Rewind:**
- **Restart**: Begins the story from the very beginning, clearing all history
- **Rewind**: Returns to the most recent choice point, preserving the story history up to that point

When the story is restarted, the extension will automatically recompile any changes that have occurred since the preview was last started.

### Linking External JavaScript Files

> [!IMPORTANT]
> External JavaScript function linking is currently an **experimental feature** and may be subject to changes in future versions.

The extension provides the ability to link external JavaScript files to your Ink stories, allowing you to provide mock implementations of external functions for testing and previewing purposes.

#### LINK Directive Syntax

External JavaScript files are linked using the `LINK` directive within comments in your Ink stories. The directive must be placed inside either a single-line comment or a multi-line comment block:

**Single-line comment syntax:**
```ink
// LINK external-functions.js
// LINK utils/helpers.js
```

**Multi-line comment syntax:**
```ink
/* LINK external-functions.js */
/* LINK utils/helpers.js */
```

#### JavaScript File Format

External JavaScript files must export functions using CommonJS module syntax:

```javascript
// Using exports (recommended)
exports.getName = function() {
  return "TestPlayer";
};

exports.addNumbers = function(a, b) {
  return a + b;
};

exports.greetPlayer = function(name) {
  return `Welcome, ${name}! Ready for adventure?`;
};

// Or using module.exports
module.exports = {
  getName: function() {
    return "TestPlayer";
  },
  
  addNumbers: function(a, b) {
    return a + b;
  },
  
  greetPlayer: function(name) {
    return `Welcome, ${name}! Ready for adventure?`;
  }
};
```

#### Usage in Ink Stories

Once linked, external functions can be used directly in your Ink stories:

```ink
// LINK external-functions.js

EXTERNAL getName()
EXTERNAL addNumbers(a, b)
EXTERNAL greetPlayer(name)

Your name is {getName()}.
You have {addNumbers(5, 3)} gold coins.
{greetPlayer(getName())}

-> END
```

#### Path Resolution

External JavaScript file paths are resolved using the same path resolution logic as Ink story `INCLUDE` statements.

#### Security and Sandboxing

External JavaScript files are executed in a secure sandboxed environment with the following restrictions:

- **Limited global access**: Only safe globals like `Math`, `Date`, `JSON`, and basic parsing functions are available
- **No file system access**: Functions cannot read or write files
- **No network access**: Functions cannot make HTTP requests or access external resources
- **Execution timeout**: Function execution is limited to 5 seconds to prevent infinite loops

#### Error Handling

Errors related to external JavaScript files are reported in the preview panel and Problems panel.

#### Limitations

- External JavaScript files are only processed during compilation and preview
- Functions must be synchronous (no async/await or Promise support)
- Limited to CommonJS module patterns (no ES6 modules or modern JavaScript features)

### Keyboard Shortcuts

The extension provides the following keyboard shortcuts for quick access to common actions:

| Action        | Windows/Linux | macOS            |
| ------------- | ------------- | ---------------- |
| Compile File  | `Shift+Alt+K` | `Shift+Option+K` |
| Preview Story | `Ctrl+R`      | `Cmd+R`          |
| Restart Story (in preview) | `Ctrl+R` | `Cmd+R` |
| Rewind Story (in preview)  | `Ctrl+Z` | `Cmd+Z` |
| Select Choice (in preview) | `1-9` | `1-9` |
  
### Ink & Inkle Studios Documentation

- [Ink Documentation](https://github.com/inkle/ink/tree/master/Documentation)
- [Inky Editor](https://github.com/inkle/inky)
- [Inkle Studios](https://www.inklestudios.com/ink/)

## Project Information

This project is under active development.

This project leverages [inkjs](https://github.com/y-lohse/inkjs), the JavaScript implementation of Ink.

### Syntax Highlighting Attribution

This extension's syntax highlighting is based on prior work from:
- [ink-vscode by RenderBr](https://github.com/RenderBr/ink-vscode)
- [ink-vscode by sequitur](https://github.com/sequitur/ink-vscode)

### Contributing

Contributions are welcome!  
Please report issues, request features, or submit pull requests via the [project repository on GitHub](https://github.com/bemisguided/vscode-ink-language-tools).
