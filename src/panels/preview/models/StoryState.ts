export interface Choice {
  index: number;
  text: string;
  tags: string[];
}

export interface FunctionCall {
  functionName: string;
  args: any[];
  result: any;
  timestamp: number;
}

export interface StoryState {
  text: string;
  tags: string[];
  choices: Choice[];
  functionCalls: FunctionCall[];
  hasEnded: boolean;
}

export interface StoryUpdate {
  text: string;
  tags: string[];
  choices: Choice[];
  hasEnded: boolean;
}
