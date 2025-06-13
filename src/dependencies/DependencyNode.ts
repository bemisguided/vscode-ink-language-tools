import { StoryDependencyNode } from "./StoryDependencyNode";
import { PartialStoryDependencyNode } from "./PartialStoryDependencyNode";
import { ExternalFunctionDependencyNode } from "./ExternalFunctionDependencyNode";

export type DependencyNode =
  | StoryDependencyNode
  | PartialStoryDependencyNode
  | ExternalFunctionDependencyNode;
