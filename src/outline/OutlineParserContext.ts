import { OutlineEntity } from "../dependencies/OutlineEntity";

export class OutlineParserContext {
  public currentKnot: OutlineEntity | null = null;
  public currentList: OutlineEntity | null = null;
  public knotStartLine: number | null = null;
}
