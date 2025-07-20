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

import { UIReducerAction } from "../UIReducerAction";
import { UIState } from "../../UIState";

/**
 * UI Action to enable or disable the rewind functionality.
 * This action updates the rewind property in the UI state to control
 * whether the rewind button should be enabled in the webview.
 */
export class SetRewindEnabledUIAction extends UIReducerAction {
  // Static Properties ================================================================================================

  /**
   * The type identifier for this action.
   * Used for action identification, filtering, and debugging.
   */
  public static readonly typeId = "SET_REWIND_ENABLED";

  // Public Properties ==============================================================================================

  /**
   * The type identifier for this action instance.
   */
  public readonly type = SetRewindEnabledUIAction.typeId;

  /**
   * Whether the rewind functionality should be enabled.
   */
  private readonly enabled: boolean;

  // Constructor ======================================================================================================

  /**
   * Creates a new SetRewindEnabledUIAction.
   * @param enabled - True to enable rewind functionality, false to disable it
   */
  constructor(enabled: boolean) {
    super();
    this.enabled = enabled;
  }

  // Public Methods ===================================================================================================

  /**
   * Reduces the current UI state by updating the rewind property.
   * This sets the rewind availability based on the enabled parameter.
   *
   * @param state - The current UI state
   * @returns New UI state with updated rewind property
   */
  reduce(state: UIState): UIState {
    return {
      ...state,
      rewind: this.enabled,
    };
  }
} 