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

/**
 * Represents a Choice available to the player for the Story.
 */
export interface Choice {
  index: number;
  text: string;
  tags: string[];
}

/**
 * Represents a Text Story Event.
 */
export interface TextStoryEvent {
  type: "text";
  text: string;
  tags: string[];
  isCurrent?: boolean;
}

/**
 * Represents a Function Story Event.
 */
export interface FunctionStoryEvent {
  type: "function";
  functionName: string;
  args: any[];
  result: any;
  isCurrent?: boolean;
}

/**
 * An Event that occurred during the Story.
 */
export type StoryEvent = TextStoryEvent | FunctionStoryEvent;

/**
 * Represents the Severity of an Error for the Story.
 */
export type ErrorSeverity = "error" | "warning" | "info";

/**
 * Represents an Error that occurred during the Story.
 */
export interface ErrorInfo {
  /**
   * The human-readable Error Message to display to the user.
   */
  message: string;

  /**
   * The Severity of this Error.
   */
  severity: ErrorSeverity;
}

/**
 * Represents the State of the Story.
 */
export interface PreviewStoryState {
  /**
   * Choices currently available to the player for the Story.
   */
  choices: Choice[];

  /**
   * All errors that have occurred during the Story.
   */
  errors: ErrorInfo[];
  /**
   * All Story Events in chronological order for the Story.
   */
  events: StoryEvent[];

  /**
   * Indicates whether the Story has just started.
   */
  isStart: boolean;

  /**
   * Indicates whether the Story has reached an end state.
   */
  isEnded: boolean;

  /**
   * The index of the last Choice made for the Story.
   */
  lastChoiceIndex: number;
}

/**
 * Represents the State of the UI.
 */
export interface PreviewUIState {
  /**
   * Indicates whether the Story can be rewound.
   */
  canRewind: boolean;

  /**
   * Indicates whether live-update is enabled for this preview.
   */
  liveUpdateEnabled: boolean;
}

/**
 * Represents the complete State of the Preview Webview.
 */
export interface PreviewState {
  /**
   * The current state of the Story.
   */
  story: PreviewStoryState;

  /**
   * The current state of the UI.
   */
  ui: PreviewUIState;
}
