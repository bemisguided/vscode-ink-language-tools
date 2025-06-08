/**
 * Callback for each matching line.
 */
export type LineScannerCallback = (
  match: RegExpMatchArray,
  lineNumber: number,
  column: number
) => Promise<void>;

/**
 * Utility class for scanning text content line by line.
 * Provides functionality to find and process patterns in text while tracking line and column positions.
 */
export class LineScanner {
  private readonly content: string;
  private readonly pattern: RegExp;

  /**
   * Creates a new line scanner.
   * @param content - The text content to scan
   * @param pattern - The regex pattern to search for in each line
   */
  constructor(content: string, pattern: RegExp) {
    this.content = content;
    this.pattern = pattern;
  }

  // Public Methods ===================================================================================================

  /**
   * Scans the content line by line, applying the pattern to each line.
   * @param callback - Function to call for each match found
   */
  public async scan(
    callback: (
      match: RegExpMatchArray,
      line: number,
      column: number
    ) => Promise<void>
  ): Promise<void> {
    const lines = this.content.split("\n");
    let lineNumber = 0;

    for (const line of lines) {
      lineNumber++;
      const match = line.match(this.pattern);
      if (match) {
        const column = line.indexOf(match[0]) + 1;
        await callback(match, lineNumber, column);
      }
    }
  }
}
