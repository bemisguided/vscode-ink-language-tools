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
 * Flow:
 * 1. MVC initializes Webview
 *    - Webview sends 'ready' message
 * 2. MVC starts Story
 *    - MVC sends 'startStory' message
 *    - Webview resets UI state
 * 3. MVC steps through Story
 *    - MVC sends 'updateStory' message(s)
 *    - Webview renders updates
 *    - Webview waits for choice
 * 4. Webview receives Choice
 *    - Webview sends 'selectChoice' message
 *    - MVC processes choice and repeats step 3
 * 5. Story ends
 *    - MVC sends 'endStory' message
 *    - Webview shows completion
 * 6. Restart
 *    - Webview sends 'restartStory' message
 *    - MVC goes to step 2
 */

/**
 * Messages sent from Webview to MVC
 */
export const inboundMessages = {
  /** Sent when Webview is ready to receive messages */
  ready: "ready",

  /** Sent when player selects a choice */
  selectChoice: "selectChoice",

  /** Sent when player requests story restart */
  restartStory: "restartStory",

  /** Sent for debug logging */
  log: "log",
} as const;

/**
 * Messages sent from MVC to Webview
 */
export const outboundMessages = {
  /** Sent to start/restart the story */
  startStory: "startStory",

  /** Sent with story updates (events, choices) */
  updateStory: "updateStory",

  /** Sent when story reaches an end */
  endStory: "endStory",

  /** Sent to display error messages */
  showError: "showError",
} as const;

/**
 * Type for inbound message payloads
 */
export interface InboundMessagePayloads {
  [inboundMessages.ready]: void;
  [inboundMessages.selectChoice]: { choiceIndex: number };
  [inboundMessages.restartStory]: void;
  [inboundMessages.log]: { message: string };
}

/**
 * Type for outbound message payloads
 */
export interface OutboundMessagePayloads {
  [outboundMessages.startStory]: void;
  [outboundMessages.updateStory]: {
    events: Array<{
      type: "text" | "function";
      text?: string;
      tags?: string[];
      functionName?: string;
      args?: any[];
      result?: any;
    }>;
    choices: Array<{
      index: number;
      text: string;
      tags?: string[];
    }>;
    hasEnded: boolean;
  };
  [outboundMessages.endStory]: void;
  [outboundMessages.showError]: string;
}

/**
 * Type for all messages
 */
export interface Message<T = any> {
  command: string;
  payload: T;
}
