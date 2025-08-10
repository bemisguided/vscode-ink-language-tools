# Story Preview Web Panel Layout Reference

## Overview

This document provides a comprehensive reference for the Story Preview web panel layout and design in the VSCode Ink Language Tools extension. The preview system provides an interactive story viewer with real-time compilation, error handling, and player choice navigation.

## ASCII Layout Rendering

```
┌─────────────────────────────────────────────────────────────┐
│ FIXED TOOLBAR (toolbar-container)                           │
│ ┌─ Left Side ──────────────┐  ┌─ Right Side ──┐             │
│ │ [🔄 Restart] [⏪ Rewind] │  │ ⚠️2 ⛔1       │ ← Error     │
│ │ ☑Live update [🐛 Debug]  │  │               │             │
│ └──────────────────────────┘  └───────────────┘             │
├─────────────────────────────────────────────────────────────┤
│ SCROLLABLE CONTENT AREA (story-container)                   │
│                                                             │
│ ┌─ story-content ─────────────────────────────────────────┐ │
│ │ ┌─ story-group-previous (faded) ─────────────────────┐  │ │
│ │ │ │ Historical story text events...                  │  │ │
│ │ │ │ function_call(args) → result                     │  │ │
│ │ │ └─ story-tags: #tag1 #tag2 ────────────────────────┘  │ │
│ │ └───────────────────────────────────────────────────────┘ │
│ │                                                           │
│ │ ┌─ story-group-current (highlighted with border) ───────┐ │
│ │ │ │ Current story text events with fade-in animation    │ │
│ │ │ │ "You see a path ahead..."                           │ │
│ │ │ │ #forest #mysterious                                 │ │
│ │ └───────────────────────────────────────────────────────┘ │
│ └─────────────────────────────────────────────────────────┘ │
│                                                             │
├─ DEBUG PANEL (slides up from choices when toggled) ─────────┤
│ ┌─ Variables ─┐ ┌─ Console ─┐              [×] Close        │
│ │ health: 85  │ │ > Started │                               │
│ │ gold: 150 ▼ │ │ > Warning │  ← Resizable panel            │
│ │ level: 3 ─  │ │ > Message │                               │
│ └─────────────┘ └───────────┘                               │
├─────────────────────────────────────────────────────────────┤
│ FIXED BOTTOM CHOICES (choices-container) - Always visible   │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ 1  Take the forest path                                 │ │
│ │    #dangerous #shortcut                                 │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ 2  Follow the main road                                 │ │
│ │    #safe #longer                                        │ │
│ ├─────────────────────────────────────────────────────────┤ │
│ │ 3  Turn back                                            │ │
│ └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘

MODAL OVERLAY (when errors clicked):
┌─────────────────────────────────────────────────────────────┐
│                   DARK OVERLAY                              │
│         ┌─────────── ERROR MODAL ─────────────────┐         │
│         │ Issues                        [ × ]     │         │
│         ├─────────────────────────────────────────┤         │
│         │ ⚠️ WARNING: Missing include file        │         │
│         │ ⛔ ERROR: Syntax error on line 42       │         │
│         │ ℹ️  INFO: Variable not used             │         │
│         └─────────────────────────────────────────┘         │
└─────────────────────────────────────────────────────────────┘
```

## Layout Structure

### 1. Fixed Toolbar (`toolbar-container`)
- **Position**: Fixed at top of viewport
- **Background**: VSCode editor background with bottom border
- **Z-index**: 1000 (above story content)
- **Content**:
  - Left side: Control buttons and live update toggle
  - Right side: Error indicators with counts

#### Left Side Controls
- **Restart Button**: Restarts the story from beginning
- **Rewind Button**: Returns to last choice point
- **Live Update Checkbox**: Toggles automatic story recompilation
- **Debug Button**: Toggles the collapsible debug panel (shows as active when panel is open)

#### Right Side Indicators
- **Error Indicators**: Show counts for errors (red), warnings (orange), info (blue)
- **Behavior**: Hidden when count is 0, clickable to show error modal

### 2. Scrollable Content Area (`story-container`)
- **Position**: Between fixed toolbar and choices panel
- **Padding**: Top padding to account for fixed toolbar
- **Scroll**: Vertical scrolling for story history

#### Story Content (`story-content`)
- **Grouping**: Events organized by `story-group` containers
- **Visual States**:
  - `story-group-previous`: Faded historical content
  - `story-group-current`: Highlighted with blue left border

#### Event Types
- **Text Events**: Story narrative with optional tags
- **Function Events**: External function calls with syntax highlighting
- **Tags**: Displayed as hash-prefixed labels

### 3. Debug Panel (`debug-panel`)
- **Position**: Slides up from choices container when toggled
- **Background**: VSCode panel background with top border
- **Z-index**: 999 (above content, below toolbar)
- **Animation**: Smooth slide-up from choices area (300ms ease transition)

#### Panel Features
- **Tabs**: Variables and Console tabs with VSCode tab styling
- **Resizable**: Draggable top border (100px-400px height range)
- **Positioning**: Dynamically positioned above choices container
- **Close Options**: Close button, Escape key, or debug button toggle

#### Variables Tab
- **Display**: Current variable values with change indicators
- **Change Tracking**: Green arrows (↗) for increases, red (↘) for decreases
- **Data Types**: Supports strings, numbers, arrays, objects
- **Formatting**: Monospace font with VSCode variable colors

#### Console Tab  
- **Messages**: Timestamped log/warn/error messages
- **Styling**: Color-coded by severity (log=normal, warn=orange, error=red)
- **Scrolling**: Auto-scroll to newest messages
- **Limit**: 100 messages maximum to prevent memory issues

### 4. Fixed Choices Panel (`choices-container`)
- **Position**: Fixed at bottom of viewport (always visible)
- **Background**: VSCode editor background with top border
- **Content**: List of clickable choice buttons
- **Behavior**: Remains at bottom even when debug panel is open

#### Choice Buttons
- **Numbering**: Automatic numbering (1, 2, 3...)
- **Content**: Choice text with optional tags
- **Interaction**: Click to select, keyboard shortcuts (1-9 keys)

### 5. Error Modal (`error-modal`)
- **Display**: Hidden by default, shown when error indicators clicked
- **Overlay**: Semi-transparent dark background
- **Content**: Scrollable list of errors with severity icons
- **Dismissal**: Escape key, close button, or overlay click

## Visual Design Features

### Color Coding
- **Current Events**: Full opacity with blue accent border
- **Historical Events**: Reduced opacity (0.8) with muted colors
- **Error Severities**: 
  - Red for errors
  - Orange for warnings  
  - Blue for info
- **Function Syntax**: VSCode symbol colors for functions and variables
- **Tags**: Muted colors with field symbol styling

### Typography
- **Base Font**: VSCode font family (-apple-system, BlinkMacSystemFont, etc.)
- **Story Text**: 1.5em line height for readability
- **Function Calls**: Monospace font (VSCode editor font)
- **Tags**: 0.9em size, slightly transparent

### Interactive States
- **Hover Effects**: Subtle background color changes
- **Focus Indicators**: Blue outline following VSCode theme
- **Active States**: Darker background on press
- **Disabled States**: 50% opacity, disabled cursor

### Animations
- **Fade-in**: New content appears with smooth transition
- **Smooth Scrolling**: Auto-scroll to bottom on new content
- **Transitions**: 0.2s ease for button state changes
- **Debug Panel**: 300ms ease slide-up animation from choices area
- **Tab Switching**: Smooth transitions between Variables and Console tabs

## Responsive Behavior

### Layout Adaptation
- **Fixed Elements**: Toolbar and choices remain visible during scroll
- **Content Spacing**: Dynamic padding prevents overlap with fixed elements
- **Modal Centering**: Error modal centers regardless of scroll position

### Performance Optimizations
- **DOM Batching**: DocumentFragment used for multiple element creation
- **Event Delegation**: Efficient event handling for dynamic content
- **Scroll Optimization**: Multiple scroll attempts with delays for reliability

## Keyboard Shortcuts

- **Ctrl/Cmd + R**: Restart story
- **Ctrl/Cmd + Z**: Rewind story  
- **1-9 Keys**: Select corresponding choice
- **F12**: Toggle debug panel
- **Escape**: Close error modal or debug panel

## File Structure

### Core Files
- **`media/preview.js`**: Main JavaScript logic and UI management
- **`media/preview.css`**: Complete styling and responsive design
- **`src/preview/PreviewHtmlGenerator.ts`**: HTML template generation

### Asset Dependencies
- **SVG Icons**: error-icon.svg, warning-icon.svg, info-icon.svg, restart-icon.svg, rewind-icon.svg, debug-icon.svg
- **VSCode Theme**: Integrates with user's VSCode color theme

## Architecture Patterns

### State Management
- **Full State Replacement**: Complete state updates from extension
- **Server-Side Rendering**: Extension manages story state, webview renders
- **Event-Driven**: User actions dispatched as messages to extension

### Component Organization
- **storyView**: DOM manipulation and UI rendering
- **debugPanel**: Debug panel management, tabs, variables, and console
- **storyController**: Event handling and state coordination  
- **messageHandler**: VSCode extension communication
- **actionDispatcher**: User action routing

## Debug Panel Implementation

### Animation System
- **Positioning**: Panel positioned above choices using dynamic height calculation
- **Smooth Transitions**: CSS `translateY()` transforms for slide animations
- **No Position Jumps**: Panel animates directly to final position without repositioning

### Data Management
- **Variables**: Map-based storage with change tracking and JSON serialization
- **Console**: Array-based message queue with 100-message limit and timestamps
- **State Persistence**: Panel remembers active tab and visibility between sessions

### Integration Points
- **Extension Communication**: Ready for variable updates and console messages from Ink story execution
- **Responsive Layout**: Dynamically adapts to choices container height changes
- **VSCode Theming**: Full integration with user's VSCode color theme and styling

This layout provides a professional, VSCode-integrated experience for interactive Ink story development, testing, and debugging.