import { Story } from "inkjs/engine/Story";
import { FunctionCall } from "../models/StoryState";

export class MockFunctionController {
  private mockFunctions: Map<string, Function> = new Map();
  private onFunctionCall: ((call: FunctionCall) => void) | undefined;

  public registerMockFunction(name: string, fn: Function): void {
    this.mockFunctions.set(name, fn);
  }

  public bindMockFunctions(
    story: Story,
    onFunctionCall?: (call: FunctionCall) => void
  ): void {
    this.onFunctionCall = onFunctionCall;

    this.mockFunctions.forEach((mockFunction, functionName) => {
      story.BindExternalFunction(functionName, (...args: any[]) => {
        try {
          const result = mockFunction(...args);
          const call: FunctionCall = {
            functionName,
            args,
            result,
            timestamp: Date.now(),
          };

          if (this.onFunctionCall) {
            this.onFunctionCall(call);
          }

          return result;
        } catch (error) {
          console.error(`Error in mock function ${functionName}:`, error);
          throw error;
        }
      });
    });
  }

  public clearMockFunctions(): void {
    this.mockFunctions.clear();
  }
}
