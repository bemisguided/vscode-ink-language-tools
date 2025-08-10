# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VSCode Ink Language Tools is a Visual Studio Code extension providing language support for Inkle's Ink interactive fiction scripting language. The extension offers syntax highlighting, real-time compilation, error diagnostics, document outlining, and an interactive story preview system.

## Development Commands

### Build and Development
- `npm run compile` - Compile TypeScript source to JavaScript
- `npm run watch` - Watch for changes and auto-compile
- `npm run package` - Build and package the extension as .vsix

### Testing
- `npm run test` - Run all tests using Jest
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Generate test coverage report
- `npm run pretest` - Compile and lint before testing

### Code Quality
- `npm run lint` - Run ESLint on TypeScript source files

## Architecture Overview

### Plugin System
The extension uses a plugin-based architecture where components implement `IExtensionPlugin`:
- **BuildSystem** - Manages real-time Ink compilation and dependency tracking
- **OutlineSystem** - Provides document structure outline for VS Code
- **CompileCommand** - Manual compilation command
- **PreviewCommand** - Interactive story preview command

### Service Layer Pattern
All VS Code API interactions go through service facades in `src/services/`:
- **VSCodeServiceLocator** - Centralized dependency injection container
- **VSCodeDiagnosticsService** - Error/warning presentation
- **VSCodeDocumentService** - Document handling and file operations
- **VSCodeConfigurationService** - Extension settings management
- **VSCodeExtensionService** - VS Code extension API access
- **VSCodeWorkspaceNavigationService** - Workspace navigation

### Preview System Architecture
Interactive story preview uses a state-driven architecture:
- **PreviewController** - Coordinates webview and state management
- **PreviewStateManager** - Manages preview state using reducer pattern
- **PreviewStoryManager** - Handles Ink story execution via inkjs
- **Actions** (`src/preview/actions/`) - Immutable state transformations
- **State Types** - Strongly typed state objects (StoryState, UIState, etc.)

### Build System
Real-time compilation system:
- **BuildEngine** - Core compilation using inkjs
- **DependencyManager/DependencyNode** - Tracks Ink file dependencies and includes
- **Path Resolution** - Advanced and default strategies for include paths

### Code Organization Patterns

#### File Naming
- Classes: PascalCase (`PreviewController.ts`)
- Interfaces: PascalCase with 'I' prefix (`IExtensionPlugin.ts`)
- Services: Descriptive names (`VSCodeConfigurationService.ts`)
- Utilities: lowercase (`debounce.ts`, `parseErrorMessage.ts`)

#### Class Structure
Classes follow consistent section organization:
```typescript
export class Example {
  // Static Properties
  // Private Properties  
  // Public Properties
  // Constructor
  // Public Methods
  // Private Methods
}
```

#### Interface Design
- Service interfaces define contracts for VS Code API access
- Action interfaces define state transformation operations
- Strong typing with readonly properties where appropriate

## Testing Standards

### Test Organization
- Tests mirror source structure in `tests/` directory
- Method-based organization with `.methodName()` describe blocks
- Three-phase structure: Setup/Execute/Assert (commented)
- Shared mocks in `tests/__mocks__/` directory

### Mock Strategy
- Use existing shared mocks first (MockWebviewPanel, MockBuildEngine, etc.)
- Purpose-built test mocks over wrapper mocks
- Direct dependencies only - avoid deep mock chains
- Factory functions for consistent test data creation

### Test Commands
- Single test: `npm test -- --testNamePattern="ClassName"`
- Specific test file: `npm test tests/path/to/file.test.ts`
- Watch mode: `npm run test:watch`

## Key Dependencies
- **inkjs** (v2.2.0) - JavaScript Ink compiler implementation
- **immer** (v10.1.1) - Immutable state updates in preview system
- **jest** + **ts-jest** - Testing framework with TypeScript support
- **@types/vscode** - VS Code API type definitions

## Important Configuration Files
- `package.json` - Extension manifest with VS Code contributions
- `tsconfig.json` - TypeScript project configuration with project references
- `jest.config.js` - Test configuration with VS Code mocking
- `language-configuration.json` - Ink language configuration for VS Code
- `syntaxes/ink.tmLanguage` - TextMate grammar for syntax highlighting

## Extension Features
- Real-time Ink compilation with error diagnostics
- Document outline showing knots, stitches, variables, functions
- Interactive story preview with state management
- External JavaScript function linking for testing
- Advanced path resolution for include files
- Configurable output generation (JSON/JavaScript)