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

import { StoryEvent, Choice, ErrorInfo } from "./PreviewState";

/**
 * Represents the result of a story progression operation.
 * This interface encapsulates all the data produced when the story
 * advances (through continue or choice selection operations).
 */
export interface StoryProgressResult {
  /**
   * Story events generated during the operation.
   * These include text events from story continuation and any function call events.
   */
  events: StoryEvent[];

  /**
   * Choices currently available to the player after the operation.
   * Empty when the story has ended or when no choices are available.
   */
  choices: Choice[];

  /**
   * Whether the story has reached an end state after this operation.
   * True when the story can no longer continue and has no available choices.
   */
  isEnded: boolean;

  /**
   * Errors that occurred during the story operation.
   * These include runtime errors, validation errors, and any other issues
   * that occurred while processing the story.
   */
  errors: ErrorInfo[];
}
