import { OutlineParserContext } from "./OutlineParserContext";
import { OutlineEntity } from "../model/OutlineEntity";

export interface EntityParser {
  tryParse(
    line: string,
    lineNumber: number,
    context: OutlineParserContext
  ): OutlineEntity | null;
}
