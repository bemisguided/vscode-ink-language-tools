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
import { glob } from "../../src/util/glob";

describe("glob()", () => {
  function mockUri(path: string): vscode.Uri {
    return vscode.Uri.file(path);
  }

  (vscode.workspace as any).asRelativePath = (uri: vscode.Uri, _?: boolean) => {
    // Remove the root from the start of the path
    const fullPath = uri.fsPath.replace(/\\/g, "/");
    // For this test, root is always "/foo"
    return fullPath.startsWith("/foo/")
      ? fullPath.slice("/foo/".length)
      : fullPath;
  };

  it("matches simple * patterns", () => {
    expect(glob(mockUri("/foo/bar.txt"), "*.txt")).toBe(false);
    expect(glob(mockUri("/foo/bar.txt"), "foo/*.txt")).toBe(false);
    expect(glob(mockUri("/foo/bar.txt"), "**/*.txt")).toBe(true);
    expect(glob(mockUri("/foo/bar.txt"), "foo/bar.*")).toBe(false);
    expect(glob(mockUri("/foo/bar.txt"), "**/bar.*")).toBe(true);
  });

  it("matches ? patterns", () => {
    expect(glob(mockUri("/foo/bar.txt"), "foo/ba?.txt")).toBe(false);
    expect(glob(mockUri("/foo/bar.txt"), "**/ba?.txt")).toBe(true);
    expect(glob(mockUri("/foo/baz.txt"), "**/ba?.txt")).toBe(true);
    expect(glob(mockUri("/foo/ba.txt"), "**/ba?.txt")).toBe(false);
  });

  it("matches ** patterns", () => {
    expect(glob(mockUri("/foo/bar/baz.txt"), "foo/**/baz.txt")).toBe(false);
    expect(glob(mockUri("/foo/bar/baz.txt"), "**/baz.txt")).toBe(true);
    expect(glob(mockUri("/foo/bar/baz.txt"), "foo/bar/**/baz.txt")).toBe(false);
    expect(glob(mockUri("/foo/bar/baz.txt"), "**/bar/**/baz.txt")).toBe(true);
  });

  it("matches with root argument (relative path)", () => {
    const root = mockUri("/foo");
    const file = mockUri("/foo/bar/baz.txt");
    expect(glob(file, "bar/*.txt", root)).toBe(true);
    expect(glob(file, "bar/baz.txt", root)).toBe(true);
    expect(glob(file, "**/baz.txt", root)).toBe(true);
  });

  it("does not match when pattern is not satisfied", () => {
    expect(glob(mockUri("/foo/bar.txt"), "baz/*.txt")).toBe(false);
    expect(glob(mockUri("/foo/bar.txt"), "foo/baz.*")).toBe(false);
    expect(glob(mockUri("/foo/bar.txt"), "**/baz.txt")).toBe(false);
  });
});
