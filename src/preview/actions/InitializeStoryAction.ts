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

import { PreviewReducerAction } from "../PreviewAction";
import { PreviewState } from "../PreviewState";

/**
 * Action to initialize the story metadata.
 * Sets the title and file name for the story being previewed.
 */
export class InitializeStoryAction extends PreviewReducerAction {
  private readonly title: string;
  private readonly fileName: string;

  constructor(title: string, fileName: string) {
    super();
    this.title = title;
    this.fileName = fileName;
  }

  /**
   * Reduces the current state by updating the metadata.
   * Sets the story title and file name while preserving other state.
   *
   * @param state - The current preview state
   * @returns New state with updated metadata
   */
  reduce(state: PreviewState): PreviewState {
    return {
      ...state,
      metadata: {
        ...state.metadata,
        title: this.title,
        fileName: this.fileName,
      },
    };
  }
}
