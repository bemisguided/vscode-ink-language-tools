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

export interface TextStoryEvent {
  type: "text";
  text: string;
  tags: string[];
}

export interface FunctionStoryEvent {
  type: "function";
  functionName: string;
  args: any[];
  result: any;
}

export type StoryEvent = TextStoryEvent | FunctionStoryEvent;

export interface StoryGroup {
  id: number;
  events: StoryEvent[];
  choices: Choice[];
  hasEnded: boolean;
  timestamp: number;
}

export interface StoryState {
  currentGroup: StoryGroup | null;
  history: StoryGroup[];
}

export interface StoryUpdate {
  choices: Choice[];
  hasEnded: boolean;
  events: StoryEvent[];
}
