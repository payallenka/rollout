/** A file handed to a transform. */
export interface FileContext {
  /** path relative to the repository root, always POSIX-separated */
  path: string;
  source: string;
  /** the repository this file came from, as given in the config */
  repo: string;
}

/**
 * Returns the rewritten source, or null to leave the file untouched.
 *
 * Returning the source unchanged is the same as returning null: Rollout
 * compares before and after and skips files that did not actually move.
 */
export type Transform = (file: FileContext) => string | null | undefined;

export interface RepoTarget {
  /** "owner/name" for GitHub, or a path on disk for a local repository */
  repo: string;
  /** branch to cut from; defaults to the repository's default branch */
  base?: string;
}

export interface RolloutConfig {
  /** repositories to change: "owner/name", a local path, or a RepoTarget */
  repos: (string | RepoTarget)[];

  /** branch name created in every repository */
  branch: string;

  /** pull request title */
  title: string;

  /** pull request body. The migration's rationale belongs here. */
  body?: string;

  /**
   * Which files the transform sees. Globs support `*`, `**` and `?`.
   * Defaults to every text file that is not ignored.
   */
  include?: string[];

  /** Globs excluded before the transform runs. Sensible defaults are merged in. */
  exclude?: string[];

  /** The change itself. Optional when `run` alone does the work. */
  transform?: Transform;

  /**
   * Commands to run inside each repository after the transform, before the
   * commit. Every file they touch is captured into the diff.
   *
   *   run: [["npm", "install", "--package-lock-only"]]
   *
   * This is what makes a migration correct rather than merely plausible: a
   * dependency edit that does not regenerate its lockfile produces a pull
   * request that fails CI in every repository at once.
   *
   * Arguments are passed as an array and never through a shell.
   */
  run?: string[][];

  /** Commit message. Defaults to the title. */
  commit?: string;

  /** How many repositories to process at once. Default 4. */
  concurrency?: number;

  /** Labels applied to each pull request, if the repository has them. */
  labels?: string[];

  /** Open the pull requests as drafts. Default false. */
  draft?: boolean;
}

export interface FileChange {
  path: string;
  before: string;
  after: string;
}

export interface RepoResult {
  repo: string;
  status: "changed" | "unchanged" | "failed" | "skipped";
  changes: FileChange[];
  filesScanned: number;
  /** set when a pull request was opened */
  prUrl?: string;
  error?: string;
  ms: number;
}
