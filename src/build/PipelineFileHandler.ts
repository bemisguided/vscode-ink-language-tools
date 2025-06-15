/* eslint-disable @typescript-eslint/naming-convention */
import { IFileHandler } from "inkjs/compiler/IFileHandler";
import { PipelineContext } from "./PipelineContext";

export class PipelineFileHandler implements IFileHandler {
  constructor(private ctx: PipelineContext) {}

  public get ResolveInkFilename(): (filename: string) => string {
    return (filename: string) => filename;
  }

  public get LoadInkFileContents(): (filename: string) => string {
    return (filename: string) => {
      const doc = this.ctx.includeDocuments.get(filename);
      if (!doc) {
        throw new Error(`Include file not found: ${filename}`);
      }
      return doc.getText();
    };
  }
}
