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

import { LabelParser } from "../../../src/build/outline/LabelParser";
import { OutlineEntity, EntityType } from "../../../src/model/OutlineEntity";

describe("LabelParser", () => {
  let parser: LabelParser;

  beforeEach(() => {
    parser = new LabelParser();
  });

  function makeEntity(line: string, lineNumber = 0): OutlineEntity | null {
    return parser.tryParse(line, lineNumber);
  }

  it("parses gather label", () => {
    // Execute
    const entity = makeEntity("- (foo) Some text");

    // Assert
    expect(entity).not.toBeNull();
    expect(entity!.type).toBe(EntityType.label);
    expect(entity!.name).toBe("foo");
    expect(entity!.isBlock).toBe(false);
  });

  it("parses multiple gather marker label", () => {
    // Execute
    const entity = makeEntity("- + (foo) More text", 2);

    // Assert
    expect(entity).not.toBeNull();
    expect(entity!.type).toBe(EntityType.label);
    expect(entity!.name).toBe("foo");
    expect(entity!.definitionRange.start.line).toBe(2);
  });

  it("parses choice label", () => {
    // Execute
    const entity = makeEntity("* (bar) More text", 2);

    // Assert
    expect(entity).not.toBeNull();
    expect(entity!.type).toBe(EntityType.label);
    expect(entity!.name).toBe("bar");
    expect(entity!.definitionRange.start.line).toBe(2);
  });

  it("parses multiple choice marker label", () => {
    // Execute
    const entity = makeEntity("* * (bar) More text", 2);

    // Assert
    expect(entity).not.toBeNull();
    expect(entity!.type).toBe(EntityType.label);
    expect(entity!.name).toBe("bar");
    expect(entity!.definitionRange.start.line).toBe(2);
  });

  it("parses sticky label", () => {
    // Execute
    const entity = makeEntity("+ (sticky_label) Option", 2);

    // Assert
    expect(entity).not.toBeNull();
    expect(entity!.type).toBe(EntityType.label);
    expect(entity!.name).toBe("sticky_label");
    expect(entity!.definitionRange.start.line).toBe(2);
  });

  it("parses multiple sticky marker label", () => {
    // Execute
    const entity = makeEntity("+ + (bar) More text", 2);

    // Assert
    expect(entity).not.toBeNull();
    expect(entity!.type).toBe(EntityType.label);
    expect(entity!.name).toBe("bar");
    expect(entity!.definitionRange.start.line).toBe(2);
  });

  it("parses label with whitespace in parens", () => {
    // Execute
    const entity = makeEntity("    * (  spaced_label  ) Option");

    // Assert
    expect(entity).not.toBeNull();
    expect(entity!.name).toBe("spaced_label");
  });

  it("does not match if no label parens", () => {
    // Execute & Assert
    expect(makeEntity("- not_a_label Some text")).toBeNull();
    expect(makeEntity("+ Some text (not_a_label)")).toBeNull();
    expect(makeEntity("* ( not a label)")).toBeNull();
  });
});
