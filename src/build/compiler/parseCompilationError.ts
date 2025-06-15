export type ErrorDetails = {
  message: string;
  line: number;
  filename?: string;
  severity: "ERROR" | "WARNING";
};

export function parseCompilationError(errorText: string): ErrorDetails {
  let line = 0;
  let message = errorText;
  let filename: string | undefined = undefined;
  let severity: "ERROR" | "WARNING" = "ERROR";

  // Extract severity from prefix
  const sevMatch = errorText.match(/^(ERROR|WARNING):/i);
  if (sevMatch) {
    severity = sevMatch[1].toUpperCase() as "ERROR" | "WARNING";
  }

  // Extract filename if present (between quotes after ERROR: or WARNING:)
  // Example: ERROR: '/path/file.ink' line 18: ...
  const fileMatch = errorText.match(/^[A-Z]+:\s*'([^']+)'\s+line/i);
  if (fileMatch) {
    filename = fileMatch[1];
  }

  // Parse line number from various patterns
  const lineMatch = errorText.match(/line (\d+)/i);
  if (lineMatch) {
    line = parseInt(lineMatch[1], 10) - 1; // Convert to 0-based
  }

  // Extract everything after the first colon following the line number
  // Example: ... line 18: Message here\n(more lines)
  const lineNumMatch = /line \d+/i.exec(errorText);
  if (lineNumMatch) {
    const colonIndex = errorText.indexOf(
      ":",
      lineNumMatch.index + lineNumMatch[0].length
    );
    if (colonIndex !== -1) {
      message = errorText.slice(colonIndex + 1).trim();
    }
  }

  return { message, line, filename, severity };
}
