import { PipelineProcessor } from "./PipelineProcessor";
import { PipelineContext } from "./PipelineContext";
import { OutlineParser } from "../outline/OutlineParser";
import { OutlineManager } from "../dependencies/OutlineManager";

export class OutlinePipelineProcessor implements PipelineProcessor {
  async run(ctx: PipelineContext): Promise<void> {
    const parser = OutlineParser.getInstance();
    const outlineManager = OutlineManager.getInstance();
    const document = await ctx.getTextDocument();
    const entities = parser.parse(document);
    outlineManager.setOutline(document.uri, entities);
  }
}
