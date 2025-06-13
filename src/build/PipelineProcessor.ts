import { PipelineContext } from "./PipelineContext";

export interface PipelineProcessor {
  run(ctx: PipelineContext): Promise<void>;
}
