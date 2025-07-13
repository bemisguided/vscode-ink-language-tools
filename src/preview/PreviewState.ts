/**
 * MIT License
 *
 * Copyright (c) 2025 Martin Crawford
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { StoryEvent, Choice } from "./types";
import { ErrorInfo } from "./ErrorInfo";

/**
 * Represents the complete state of the preview webview.
 * This is the single source of truth for all preview data and is designed
 * to be sent as a complete snapshot to the webview for state replacement.
 */
export interface PreviewState {
  /**
   * All story events in chronological order since the story began.
   * This includes text events from story continuation and function call events.
   * Events are appended as the story progresses and are never removed until restart.
   */
  storyEvents: StoryEvent[];

  /**
   * Choices currently available to the player.
   * This array is replaced each time the story continues and new choices become available.
   * Empty when the story has ended or when no choices are available.
   */
  currentChoices: Choice[];

  /**
   * All errors that have occurred during story execution.
   * Includes compilation errors, runtime errors, and warnings.
   * Errors accumulate over time and persist until explicitly cleared or story restarts.
   */
  errors: ErrorInfo[];

  /**
   * Whether the story has reached an end state.
   * True when the story can no longer continue and has no available choices.
   * Used by the webview to display end-of-story UI elements.
   */
  isEnded: boolean;

  /**
   * Whether the next update should clear/restart the UI.
   * True when starting a new story or restarting an existing story.
   * The webview should clear all content and reset to initial state when this is true.
   * Automatically set to false after the first story continuation.
   */
  isStart: boolean;

  /**
   * Index in storyEvents array where the current turn started.
   * Events with index >= lastChoiceIndex are considered current (from the current turn).
   * Events with index < lastChoiceIndex are considered historical (from previous turns).
   * Updated by SetCurrentChoicesAction when new choices are presented.
   */
  lastChoiceIndex: number;

  /**
   * Metadata about the current story file and presentation.
   * Used for display purposes in the webview title and UI elements.
   * Can be extended with additional properties for action-specific metadata.
   */
  metadata: {
    /**
     * Display name for the story, typically the base filename.
     * Used in the webview panel title and story header.
     */
    title: string;

    /**
     * Full file path of the story file being previewed.
     * Used for debugging and file identification purposes.
     */
    fileName: string;
  };
}
