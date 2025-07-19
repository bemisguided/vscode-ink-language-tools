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

import { UIAction } from "../UIAction";
import { InitializeStoryAction } from "../story/InitializeStoryAction";
import { StartStoryAction } from "../story/StartStoryAction";
import { ContinueStoryAction } from "../story/ContinueStoryAction";
import { UIActionContext } from "../../UIActionContext";

export class RestartStoryUIAction implements UIAction {
  readonly type = "RESTART_STORY";

  apply(context: UIActionContext): void {
    console.debug("[RestartStoryUIAction] Restarting story");
    // Initialize, start, and continue story - these actions handle state updates
    context.dispatch(new InitializeStoryAction());
    context.dispatch(new StartStoryAction());
    context.dispatch(new ContinueStoryAction());
    // Send updated state to webview
    context.sendStoryState();
  }
}
