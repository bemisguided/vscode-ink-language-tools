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
 * Message protocol for communication between the MVC (Model-View-Controller) and Webview.
 *
 * Uses Full State Replacement Pattern:
 * 1. Webview sends 'ready' message when loaded
 * 2. MVC sends complete state updates via 'updateState' message
 * 3. Webview sends user actions (choice selection, restart, etc.)
 * 4. MVC responds with updated complete state
 */

/**
 * Messages sent from Webview to MVC
 */
export const inboundMessages = {
  /** Sent when Webview is ready to receive messages */
  ready: "ready",

  /** Sent when player performs any action */
  action: "action",
} as const;

import { UIAction } from "./actions/UIAction";

/**
 * Type for inbound message payloads
 */
export interface InboundMessagePayloads {
  [inboundMessages.ready]: void;
  [inboundMessages.action]: UIAction;
}

/**
 * Type for all messages
 */
export interface Message<T = any> {
  command: string;
  payload: T;
}
