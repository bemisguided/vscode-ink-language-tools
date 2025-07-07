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

## Coming Soon
This extension is under active development with the following planned features:

- **Mocking External Functions**  
  Simulate external function calls for testing and previewing stories without a full game engine.

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

By default, the extension compiles your story for analysis and error checking without creating any output files. However, you can configure it to emit the compiled Ink JSON story file.

-   **Enable JSON Output**: To enable writing the compiled JSON file, set the `ink.compile.output.enableEmitStoryJSON` (default: `false`) setting to `true`.
  
-   **Output Directory**: By default, compiled files are placed in an `out` folder in your workspace root. You can specify a different location by changing the `ink.compile.output.directory` (default: `out`) setting.
  
-   **Ignoring Included Files**: It is common to have Ink files that are meant to be included in other files and not compiled as standalone stories (e.g., `_character_definitions.ink`). By default, files starting with an underscore are not emitted as separate JSON files. You can customize this behavior with the `ink.compile.output.ignoreInkIncludes` (default: `**/_*.ink`) glob pattern setting.

#### Compilation Options

You can fine-tune the Ink compiler's behavior with the following setting:

-   **Count All Visits**: The `ink.compile.options.enableCountAllVisits` (default: `true`) setting is enabled by default. This corresponds to the Ink compiler option that tracks the visit count for all knots, stitches, etc. You can disable it if your story's logic requires it.   

### Previewing Ink Stories

The extension provides an interactive preview feature that allows you to play through your Ink Stories directly within Visual Studio Code.

#### Starting a Preview

You can start a preview by using the keyboard shortcut `Ctrl+R` (`Cmd+R` on macOS), right-clicking on any `.ink` file in the Explorer and selecting "Ink: Preview Story", or using the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P`) and selecting "Ink: Preview Story".

The preview opens in a new panel alongside your editor, displaying your story's content and any available choices.

#### Navigation Controls

The preview supports both mouse and keyboard navigation for ease of use. You can click on choice buttons or the restart button in the toolbar using your mouse. For keyboard navigation, use the number keys (`1-9`) to select choices, or press `Ctrl+R` (`Cmd+R` on macOS) to restart the story. When the story is restarted, the extension will automatically recompile any changes that have occurred since the preview was last started.

### Keyboard Shortcuts

The extension provides the following keyboard shortcuts for quick access to common actions:

| Action        | Windows/Linux | macOS            |
| ------------- | ------------- | ---------------- |
| Compile File  | `Shift+Alt+K` | `Shift+Option+K` |
| Preview Story | `Ctrl+R`      | `Cmd+R`          |
  
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
