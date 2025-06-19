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

import * as vscode from "vscode";

/**
 * Converts a simple glob pattern to a RegExp.
 * Supports *, **, and ?.
 */
function globToRegExp(glob: string): RegExp {
  // Replace glob wildcards with regex equivalents BEFORE escaping
  const parts = glob.split("/").map((part) => {
    if (part === "**") {
      return "(.+/)?";
    }
    // Replace * and ? with placeholders
    let replaced = part
      .replace(/\*/g, "__GLOBSTAR__")
      .replace(/\?/g, "__GLOBQ__");
    // Escape all regex special characters
    replaced = replaced.replace(/[.+^${}()|[\\]\\]/g, "\\$&");
    // Restore glob wildcards as regex
    replaced = replaced
      .replace(/__GLOBSTAR__/g, "[^/]*")
      .replace(/__GLOBQ__/g, "[^/]");
    return replaced;
  });

  // Join parts, but avoid double slashes after (.+/)?
  let regex = parts[0];
  for (let i = 1; i < parts.length; i++) {
    // If previous part ends with /)? and current part is not empty, don't add extra /
    if (regex.endsWith("/)?")) {
      regex += parts[i];
    } else {
      regex += "/" + parts[i];
    }
  }

  return new RegExp(`^${regex}$`);
}

/**
 * Matches a VSCode Uri path against a glob pattern.
 * @param uri Uri to test
 * @param glob Glob pattern (supports *, **, ?)
 * @param root Optional workspace root; if provided, path will be relative
 * @returns True if match
 */
export function glob(
  uri: vscode.Uri,
  glob: string,
  root?: vscode.Uri
): boolean {
  const path = root
    ? vscode.workspace.asRelativePath(uri, false).replace(/\\/g, "/")
    : uri.fsPath.replace(/\\/g, "/");

  return globToRegExp(glob).test(path);
}
