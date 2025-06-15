import { PipelineProcessor } from "./PipelineProcessor";
import { PipelineContext } from "./PipelineContext";
import { OutlineParser } from "../outline/OutlineParser";
import { OutlineManager } from "../model/OutlineManager";

export class OutlineProcessor implements PipelineProcessor {
  async run(ctx: PipelineContext): Promise<void> {
    const parser = OutlineParser.getInstance();
    const outlineManager = OutlineManager.getInstance();
    const document = await ctx.getTextDocument();
    const entities = await parser.parse(document);
    outlineManager.setOutline(document.uri, entities);
  }
}
