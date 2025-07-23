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

import { PreviewAction } from "../PreviewAction";
import { PreviewState } from "../PreviewState";
import { PreviewActionContext } from "../PreviewActionContext";

/**
 * Base interface for actions sent from the webview to the controller.
 * These actions represent user interactions and execute their own logic.
 */
export interface UIAction extends PreviewAction {
  /**
   * Indicates that the Category of this Preview Action is "ui".
   */
  category: "ui";

  /**
   * Optional payload containing action-specific data.
   * Must be JSON serializable for webview communication.
   */
  readonly payload?: any;
}

/**
 * Helper function to create UIAction instances from webview data.
 * @param actionData - Raw action data from webview
 * @returns Constructed UIAction instance
 */
export function createUIAction(actionData: {
  type: string;
  payload?: any;
}): UIAction {
  // Simple implementation for now
  return {
    type: actionData.type,
    category: "ui",
    historical: true,
    payload: actionData.payload,
    apply: (state: PreviewState) => state,
    effect: (context: PreviewActionContext) => {
      // no-op for now
    },
  };
}
