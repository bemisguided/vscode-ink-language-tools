/* eslint-disable @typescript-eslint/naming-convention */
import { IFileHandler } from "inkjs/compiler/IFileHandler";
import { PipelineContext } from "../PipelineContext";

export class VSCodeFileHandler implements IFileHandler {
  constructor(private ctx: PipelineContext) {}

  public get ResolveInkFilename(): (filename: string) => string {
    return (filename: string) => filename;
  }

  public get LoadInkFileContents(): (filename: string) => string {
    return (filename: string) => {
      const doc = this.ctx.includeDocuments.get(filename);
      if (!doc) {
        // eslint-disable-next-line no-throw-literal
        throw ` INCLUDE "${filename}" file not found`;
      }
      return doc.getText();
    };
  }
}
