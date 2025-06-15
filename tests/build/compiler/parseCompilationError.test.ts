import { parseCompilationError } from "../../../src/build/compiler/parseCompilationError";

describe("parseCompilationError()", () => {
  it("parses single-line error with filename and line with severity", () => {
    // Setup
    const errorText =
      "WARNING: '/Users/martin.crawford/Development/Workspaces/RPG/test/test.ink' line 20: Apparent loose end exists where the flow runs out. Do you need a '-> DONE' statement, choice or divert? Note that if you intend to enter 'test_stictch' next, you need to divert to it explicitly.";

    // Execute
    const result = parseCompilationError(errorText);

    // Assert
    expect(result.filename).toBe(
      "/Users/martin.crawford/Development/Workspaces/RPG/test/test.ink"
    );
    expect(result.line).toBe(19); // 0-based
    expect(result.severity).toBe("WARNING");
    expect(result.message).toBe(
      "Apparent loose end exists where the flow runs out. Do you need a '-> DONE' statement, choice or divert? Note that if you intend to enter 'test_stictch' next, you need to divert to it explicitly."
    );
  });

  it("parses multi-line error with filename and line with severity", () => {
    // Setup
    const errorText =
      "ERROR: '/Users/martin.crawford/Development/Workspaces/RPG/test/test.ink' line 18: Logic following a '~' can't be that type of expression. It can only be something like:\n\t~ return\n\t~ var x = blah\n\t~ x++\n\t~ myFunction()";

    // Execute
    const result = parseCompilationError(errorText);

    // Assert
    expect(result.filename).toBe(
      "/Users/martin.crawford/Development/Workspaces/RPG/test/test.ink"
    );
    expect(result.line).toBe(17); // 0-based
    expect(result.severity).toBe("ERROR");
    expect(result.message).toBe(
      "Logic following a '~' can't be that type of expression. It can only be something like:\n\t~ return\n\t~ var x = blah\n\t~ x++\n\t~ myFunction()"
    );
  });
});
