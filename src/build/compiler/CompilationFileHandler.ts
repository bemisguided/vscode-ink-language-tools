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

/* eslint-disable @typescript-eslint/naming-convention */
import { IFileHandler } from "inkjs/compiler/IFileHandler";
import { PipelineContext } from "../PipelineContext";

/**
 * Implements the inkjs IFileHandler interface for the extension compiler.
 */
export class CompilationFileHandler implements IFileHandler {
  // Constructor ======================================================================================================

  constructor(private context: PipelineContext) {}

  // Public Methods ===================================================================================================

  /**
   * Resolves the filename of an ink file.
   * @param filename - The filename to resolve.
   * @returns The resolved filename.
   */
  public get ResolveInkFilename(): (filename: string) => string {
    return (filename: string) => filename;
  }

  /**
   * Loads the contents of an ink file.
   * @param filename - The filename to load.
   * @returns The contents of the file.
   */
  public get LoadInkFileContents(): (filename: string) => string {
    return (filename: string) => {
      const doc = this.context.includeDocuments.get(filename);
      if (!doc) {
        // eslint-disable-next-line no-throw-literal
        throw ` INCLUDE "${filename}" file not found`;
      }
      return doc.getText();
    };
  }
}
