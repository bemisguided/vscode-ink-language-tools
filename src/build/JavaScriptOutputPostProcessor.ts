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

import { BaseOutputPostProcessor } from "./BaseOutputPostProcessor";
import { IVSCodeConfigurationService } from "../services/VSCodeConfigurationService";
import { IVSCodeDocumentService } from "../services/VSCodeDocumentService";

/**
 * A pipeline processor that writes the compiled story's JSON wrapped in JavaScript to a file.
 */
export class JavaScriptOutputPostProcessor extends BaseOutputPostProcessor {
  // Constructor ======================================================================================================

  constructor(
    configService?: IVSCodeConfigurationService,
    documentService?: IVSCodeDocumentService
  ) {
    super(configService, documentService);
  }

  // Protected Methods ================================================================================================

  /**
   * @inheritdoc
   */
  protected getSettingName(): string {
    return "ink.compile.output.enableEmitStoryJavaScript";
  }

  /**
   * @inheritdoc
   */
  protected getFileExtension(): string {
    return "js";
  }

  /**
   * @inheritdoc
   */
  protected transformContent(jsonContent: string): string {
    return `var storyContent = ${jsonContent};`;
  }

  /**
   * @inheritdoc
   */
  protected getErrorMessageType(): string {
    return "JavaScript";
  }
}
