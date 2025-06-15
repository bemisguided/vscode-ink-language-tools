// Modular InkOutlineParser with strategy-based symbol parsing
import * as vscode from "vscode";
import { KnotParser } from "./KnotParser";
import { StitchParser } from "./StitchParser";
import { FunctionParser } from "./FunctionParser";
import { ExternalParser } from "./ExternalParser";
import { VariableParser } from "./VariableParser";
import { IncludeParser } from "./IncludeParser";
import { OutlineParserContext } from "./OutlineParserContext";
import { OutlineEntity, SymbolType } from "../../model/OutlineEntity";
import { ListParser } from "./ListParser";

export class OutlineParser {
  private static instance: OutlineParser | null = null;
  private strategies: any[];

  public static getInstance(): OutlineParser {
    if (!this.instance) {
      this.instance = new OutlineParser();
    }
    return this.instance;
  }

  constructor() {
    this.strategies = [
      new IncludeParser(),
      new KnotParser(),
      new StitchParser(),
      new FunctionParser(),
      new ExternalParser(),
      new VariableParser(),
      new ListParser(),
    ];
  }

  public async parse(document: vscode.TextDocument): Promise<OutlineEntity[]> {
    const entities: OutlineEntity[] = [];
    const lines = document.getText().split(/\r?\n/);
    const context = new OutlineParserContext();
    let lastKnot: OutlineEntity | null = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      if (trimmed === "" || trimmed.startsWith("//")) {
        continue;
      }

      let handled = false;
      for (const strategy of this.strategies) {
        const entity = strategy.tryParse(line, i, context);
        if (entity) {
          // If this is a knot, handle scope range for the previous knot
          if (entity.type === SymbolType.knot) {
            if (lastKnot) {
              // Set the scope range of the previous knot
              lastKnot.scopeRange = new vscode.Range(
                lastKnot.definitionLine,
                0,
                i - 1,
                lines[i - 1]?.length || 0
              );
            }
            lastKnot = entity;
            context.knotStartLine = i;
            entities.push(entity);
          } else {
            entities.push(entity);
          }
          handled = true;
          break;
        }
      }
    }

    // After the loop, set the scope range for the last knot (if any)
    if (lastKnot) {
      lastKnot.scopeRange = new vscode.Range(
        lastKnot.definitionLine,
        0,
        lines.length - 1,
        lines[lines.length - 1]?.length || 0
      );
    }

    return entities;
  }
}
