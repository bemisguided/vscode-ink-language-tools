# Ink Language Support for Visual Studio Code

Advanced support for [Inkle's Ink](https://www.inklestudios.com/ink/) narrative scripting language in Visual Studio Code.

## Features

### 🎨 Syntax Highlighting
- Complete syntax highlighting for all Ink language constructs
- Knots and stitches highlighting
- Choice syntax (`*` and `+`) with conditional support
- Divert arrows (`->`) and tunnel syntax
- Variable declarations (`VAR`, `CONST`, `temp`)
- List declarations and operations
- Function definitions and calls
- Conditional text and logic blocks
- Comments (both `//` and `/* */`)
- Tags (`#`) and includes

### 🔧 Real-time Compilation
- **Automatic compilation** on file save with 500ms debouncing
- **Error detection** with comprehensive error reporting in VSCode Problems panel
- **Include support** with custom INCLUDE processing and dependency tracking
- **File watching** - automatically recompiles when included files change
- **Structured error classification** with recovery suggestions
- **Command palette integration** with `Ink: Compile File` and `Ink: Debug Compile File` commands

### ⚡ Advanced Error Handling
- **Syntax errors** with precise line and column information
- **Include errors** for missing or malformed include statements
- **Runtime errors** detected during compilation
- **Smart error recovery** with context-aware suggestions
- **Clean console logging** with compilation status indicators

### 📁 Include System
- **Custom INCLUDE processing** with accurate line number reporting
- **Relative path support** and workspace root references with `/`
- **Dependency tracking** for multi-file projects
- **File watching** automatically detects changes in included files
- **Error reporting** for missing include files with proper line numbers

### ✨ Code Snippets
Comprehensive snippet collection for rapid Ink development:

- **Structure**: `knot`, `stitch`, `function`
- **Choices**: `choice`, `schoice` (sticky), `cchoice` (conditional)
- **Flow Control**: `divert`, `tunnel`, `gather`
- **Variables**: `var`, `const`, `temp`, `assign`
- **Logic**: `if`, `cond` (conditional text)
- **Alternation**: `seq` (sequence), `cycle`, `shuffle`, `once`
- **Lists**: `list`
- **Utility**: `comment`, `tag`, `include`, `end`, `done`

### 🔧 Language Configuration
- Smart bracket matching and auto-closing
- Proper comment toggling (`//` and `/* */`)
- Intelligent indentation for Ink structures
- Word boundary detection optimized for Ink syntax

## Getting Started

1. Install the extension from the VS Code Marketplace
2. Create a new file with the `.ink` extension
3. Start writing your interactive story!
4. The extension will automatically compile your story and show any errors in the Problems panel

## Example Usage

```ink
=== start ===
You wake up in a mysterious room.

* [Look around] -> examine_room
* [Try the door] -> try_door
+ [Wait and listen] -> wait

=== examine_room ===
The room is small and dimly lit. There's a {~dusty|old|worn} book on the table.

* [Read the book] -> read_book
* [Ignore it and try the door] -> try_door
- -> start

=== try_door ===
{try_door > 1: You try the door again, but it's still} The door is locked tight.
-> start

=== wait ===
You hear footsteps approaching...
-> dramatic_entrance

=== dramatic_entrance ===
The door creaks open slowly.
-> END
```

## Working with Multiple Files

The extension supports Ink's INCLUDE functionality:

**main.ink:**
```ink
INCLUDE /characters.ink

=== start ===
You meet {random_character()}.
-> END
```

**characters.ink:**
```ink
VAR character_name = ""

=== function random_character ===
~ character_name = "{~Alice|Bob|Charlie}"
~ return character_name
```

## Commands

- **Ink: Compile File** - Manually compile the current Ink file
- **Ink: Debug Compile File** - Compile with detailed debug output

## Future Enhancements

- 🎮 **Interactive story preview** panel
- 🧠 **IntelliSense** with context-aware completions  
- 📊 **Story analysis** and flow visualization
- 🔧 **Advanced debugging** tools

## Ink Language Resources

- [Official Ink Documentation](https://github.com/inkle/ink/tree/master/Documentation)
- [Ink Writer's Manual](https://github.com/inkle/ink/blob/master/Documentation/WritingWithInk.md)
- [Inky Editor](https://github.com/inkle/inky) - Official Ink story editor
- [Web Tutorial](https://www.inklestudios.com/ink/web-tutorial/) - Learn to write web-based interactive fiction

## Contributing

This extension is open source and welcomes contributions! Please feel free to:

- Report bugs and request features via GitHub Issues
- Submit pull requests with improvements
- Share feedback and suggestions

## License

MIT License - see LICENSE file for details.

---

**Happy storytelling!** 📖✨ 