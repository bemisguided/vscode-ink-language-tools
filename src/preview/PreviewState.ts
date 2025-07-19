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

import { StoryState } from "./StoryState";
import { UIState } from "./UIState";

/**
 * Represents the complete state of the preview webview.
 * This combines both story domain state and UI domain state into a unified structure.
 * Designed to be sent as a complete snapshot to the webview for state replacement.
 */
export interface PreviewState {
  /**
   * Story domain state containing events, choices, errors, and story flow.
   * All data related to story execution and progression.
   */
  story: StoryState;

  /**
   * UI domain state controlling the availability and visual state of webview elements.
   * Contains flags for enabling/disabling functionality based on current story state.
   */
  ui: UIState;
}

// TODO: Remove this once refactor complete
export * from "./StoryState";
export * from "./UIState";
