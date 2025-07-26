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

import { ErrorInfo, ErrorSeverity } from "./PreviewState";

/**
 * Utility function to parse errors from the Ink Engine.
 * @param rawMessage - The raw error message
 * @returns Object with parsed message and severity
 */
export function parseErrorMessage(message: string): ErrorInfo {
  // Default values
  let severity: ErrorSeverity = "error";

  // Extract severity from common prefixes
  if (message.startsWith("RUNTIME ERROR:")) {
    severity = "error";
  } else if (message.startsWith("RUNTIME WARNING:")) {
    severity = "warning";
  } else if (message.startsWith("Error:")) {
    severity = "error";
  } else if (message.startsWith("Warning:")) {
    severity = "warning";
  }

  // Find the first colon and extract message after it
  const firstColonIndex = message.indexOf(":");

  // If we have at least 1 colon, extract message after the first one
  if (firstColonIndex !== -1) {
    message = message.substring(firstColonIndex + 1).trim();
  }

  return { message, severity };
}
