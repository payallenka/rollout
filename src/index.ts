export type {
  FileContext,
  FileChange,
  RepoResult,
  RepoTarget,
  RolloutConfig,
  Transform,
} from "./types.js";

export {
  addCallArgument,
  editJson,
  forExtensions,
  onlyIn,
  pipe,
  renameModule,
  renameSymbol,
  replace,
} from "./helpers.js";

export { computeChanges, processRepo } from "./engine.js";
