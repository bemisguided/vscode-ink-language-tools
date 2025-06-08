import { IFileHandler } from "inkjs/compiler/IFileHandler";
import * as path from "path";

/**
 * Handles file operations for inkjs compilation
 */
export class InkFileHandler implements IFileHandler {
  // Private Properties ===============================================================================================

  private readonly basePath: string;
  private readonly fileContents: Map<string, string>;

  // Constructor ======================================================================================================

  /**
   * Creates a new InkFileHandler
   * @param basePath - The base path for resolving relative file paths
   * @param fileContents - A map of include filenames to their contents
   */
  constructor(basePath: string, fileContents: Map<string, string>) {
    this.basePath = basePath;
    this.fileContents = fileContents;
  }

  // Public Methods ===================================================================================================

  /**
   * Resolves an ink filename to its full path
   * @param filename - The filename to resolve
   * @returns The full path to the file
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  public get ResolveInkFilename(): (filename: string) => string {
    return (filename: string) => {
      // Return the full path that inkjs expects
      return this.resolveFullFilename(filename);
    };
  }

  /**
   * Loads the contents of an ink file
   * @param filename - The filename to load
   * @returns The contents of the file
   */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  public get LoadInkFileContents(): (filename: string) => string {
    return (filename: string) => {
      const fullFilename = this.resolveFullFilename(filename);
      const content = this.fileContents.get(fullFilename);
      if (!content) {
        throw new Error(`Include file not found: ${fullFilename}`);
      }
      return content;
    };
  }

  // Private Methods ===================================================================================================

  private resolveFullFilename(filename: string): string {
    return path.resolve(this.basePath, filename);
  }
}
