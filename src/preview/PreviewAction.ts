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

import { Story } from "inkjs";
import { PreviewState } from "./PreviewState";

/**
 * Context object passed to PreviewAction.apply() method.
 * Provides access to current state, state mutation, action dispatching, and side-effect resources.
 */
export interface PreviewActionContext {
  /**
   * Gets the current preview state.
   * @returns The current preview state (immutable)
   */
  getState(): PreviewState;

  /**
   * Sets the preview state to a new state.
   * This should only be called by reducer actions that perform state mutations.
   * @param newState - The new state to set
   */
  setState(newState: PreviewState): void;

  /**
   * Dispatches another action within this action's context.
   * This allows side-effect actions to dispatch mutation actions.
   * @param action - The action to dispatch
   */
  dispatch(action: PreviewAction): void;

  /**
   * The Ink story instance for performing side effects.
   * This is provided for actions that need to interact with the story engine.
   */
  story?: Story;
}

/**
 * Base interface for all preview actions.
 *
 * This interface implements the Command pattern where each action encapsulates
 * both the data it operates on and the logic for how it transforms the state
 * and/or applies side effects.
 *
 * Actions are the primary way to modify preview state and perform side effects.
 * They can be pure state mutations or complex side-effect operations that
 * dispatch other actions.
 */
export interface PreviewAction {
  /**
   * Applies this action within the given context.
   *
   * This method can:
   * - Perform side effects (interact with story, file system, etc.)
   * - Dispatch other actions via context.dispatch()
   * - Update state via context.setState() (for reducer actions)
   *
   * The method should be idempotent when possible to support replay functionality.
   *
   * @param context - The action context providing state access and dispatch capability
   */
  apply(context: PreviewActionContext): void;
}

/**
 * Abstract base class for actions that primarily perform state mutations.
 * This provides backward compatibility for existing reducer-style actions.
 *
 * Actions that extend this class should implement the reduce() method,
 * which will be called automatically from apply().
 */
export abstract class PreviewReducerAction implements PreviewAction {
  /**
   * Applies this action to the current state and returns a new state.
   *
   * This method must be pure:
   * - No side effects (no I/O, no mutations of input parameters)
   * - Always returns a new state object (never mutates the input state)
   * - Same input always produces the same output
   * - Should use object spread syntax to create new state: `{ ...state, ... }`
   *
   * @param state - The current preview state (must not be mutated)
   * @returns A new preview state with this action applied
   */
  abstract reduce(state: PreviewState): PreviewState;

  /**
   * Applies this reducer action by calling reduce() and updating the state.
   * This bridges the gap between the new action system and existing reducer actions.
   *
   * @param context - The action context
   */
  apply(context: PreviewActionContext): void {
    const currentState = context.getState();
    const newState = this.reduce(currentState);
    context.setState(newState);
  }
}
