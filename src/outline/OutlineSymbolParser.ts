import { OutlineParserContext } from "./OutlineParserContext";
import { OutlineEntity } from "../dependencies/OutlineEntity";

export interface OutlineSymbolParser {
  tryParse(
    line: string,
    lineNumber: number,
    context: OutlineParserContext
  ): OutlineEntity | null;
}
