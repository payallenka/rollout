import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { sh } from "./exec.js";
import { globToRegExp, matchesAny, readTextFile, walk } from "./fs.js";
import type { FileChange, RepoResult, RepoTarget, RolloutConfig } from "./types.js";

const CACHE = join(process.env.ROLLOUT_HOME ?? join(homedir(), ".rollout"), "repos");

const DEFAULT_EXCLUDE = [
  "**/*.min.js", "**/*.lock", "**/package-lock.json", "**/yarn.lock",
  "**/pnpm-lock.yaml", "**/*.snap", "**/*.map",
];

export function normalizeTarget(entry: string | RepoTarget): RepoTarget {
  return typeof entry === "string" ? { repo: entry } : entry;
}

/** A local path, as opposed to an "owner/name" GitHub slug. */
export function isLocal(repo: string): boolean {
  return repo.startsWith(".") || repo.startsWith("/") || repo.startsWith("~");
}

/**
 * Produces a working directory for a repository. Local repositories are used
 * where they are; remote ones are shallow-cloned into a cache and reused, so
 * a second run does not re-download.
 */
export async function prepare(target: RepoTarget): Promise<string> {
  if (isLocal(target.repo)) {
    const dir = resolve(target.repo.replace(/^~/, homedir()));
    if (!existsSync(join(dir, ".git"))) {
      throw new Error(`${dir} is not a git repository`);
    }
    return dir;
  }

  mkdirSync(CACHE, { recursive: true });
  const dir = join(CACHE, target.repo.replace("/", "__"));

  if (existsSync(join(dir, ".git"))) {
    await sh("git", ["fetch", "--depth", "1", "origin"], { cwd: dir });
    const base = target.base ?? (await defaultBranch(dir));
    await sh("git", ["checkout", "-f", base], { cwd: dir });
    await sh("git", ["reset", "--hard", `origin/${base}`], { cwd: dir });
    await sh("git", ["clean", "-fd"], { cwd: dir });
  } else {
    const args = ["clone", "--depth", "1", "--single-branch"];
    if (target.base) args.push("--branch", target.base);
    args.push(`https://github.com/${target.repo}.git`, dir);
    await sh("git", args, { timeout: 300_000 });
  }

  return dir;
}

export async function defaultBranch(cwd: string): Promise<string> {
  try {
    const { stdout } = await sh("git", ["symbolic-ref", "--short", "refs/remotes/origin/HEAD"], { cwd });
    return stdout.trim().replace(/^origin\//, "") || "main";
  } catch {
    const { stdout } = await sh("git", ["rev-parse", "--abbrev-ref", "HEAD"], { cwd });
    return stdout.trim() || "main";
  }
}

/**
 * Applies the transform in memory and returns what would change. Nothing is
 * written: `plan` and `apply` share this, so what you review is exactly what
 * gets committed.
 */
export function computeChanges(
  dir: string,
  repo: string,
  config: RolloutConfig,
): { changes: FileChange[]; filesScanned: number } {
  const include = (config.include ?? ["**/*"]).map(globToRegExp);
  const exclude = [...DEFAULT_EXCLUDE, ...(config.exclude ?? [])].map(globToRegExp);

  const changes: FileChange[] = [];
  let filesScanned = 0;

  for (const rel of walk(dir)) {
    if (!matchesAny(rel, include)) continue;
    if (matchesAny(rel, exclude)) continue;

    const before = readTextFile(join(dir, rel));
    if (before === null) continue;
    filesScanned++;

    let after: string | null | undefined;
    try {
      after = config.transform({ path: rel, source: before, repo });
    } catch (err) {
      throw new Error(`transform threw on ${rel}: ${(err as Error).message}`);
    }

    if (after == null || after === before) continue;
    changes.push({ path: rel, before, after });
  }

  return { changes, filesScanned };
}

export function writeChanges(dir: string, changes: FileChange[]): void {
  for (const change of changes) {
    writeFileSync(join(dir, change.path), change.after, "utf8");
  }
}

/** Commits the working tree onto a fresh branch and opens a pull request. */
export async function openPullRequest(
  dir: string,
  target: RepoTarget,
  config: RolloutConfig,
): Promise<string> {
  const base = target.base ?? (await defaultBranch(dir));

  // start from a clean branch even if a previous run left one behind
  await sh("git", ["checkout", "-B", config.branch], { cwd: dir });
  await sh("git", ["add", "-A"], { cwd: dir });
  await sh("git", ["commit", "-m", config.commit ?? config.title], { cwd: dir });
  await sh("git", ["push", "--force-with-lease", "origin", config.branch], { cwd: dir });

  const args = [
    "pr", "create",
    "--head", config.branch,
    "--base", base,
    "--title", config.title,
    "--body", config.body ?? config.title,
  ];
  if (config.draft) args.push("--draft");
  for (const label of config.labels ?? []) args.push("--label", label);

  try {
    const { stdout } = await sh("gh", args, { cwd: dir });
    const url = stdout.trim().split("\n").pop() ?? "";
    return url;
  } catch (err) {
    // a pull request from this branch may already exist from an earlier run
    const { stdout } = await sh("gh", ["pr", "view", config.branch, "--json", "url", "-q", ".url"], { cwd: dir })
      .catch(() => { throw err; });
    return stdout.trim();
  }
}

/** Runs `worker` over the targets, at most `limit` at a time. */
export async function pool<T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let next = 0;

  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    for (;;) {
      const i = next++;
      if (i >= items.length) return;
      results[i] = await worker(items[i], i);
    }
  });

  await Promise.all(runners);
  return results;
}

export async function processRepo(
  entry: string | RepoTarget,
  config: RolloutConfig,
  mode: "plan" | "apply",
): Promise<RepoResult> {
  const target = normalizeTarget(entry);
  const started = Date.now();
  const base: RepoResult = {
    repo: target.repo,
    status: "unchanged",
    changes: [],
    filesScanned: 0,
    ms: 0,
  };

  try {
    const dir = await prepare(target);
    const { changes, filesScanned } = computeChanges(dir, target.repo, config);
    base.changes = changes;
    base.filesScanned = filesScanned;

    if (changes.length === 0) {
      base.status = "unchanged";
    } else if (mode === "plan") {
      base.status = "changed";
    } else if (isLocal(target.repo)) {
      // a local repository is left for the developer to inspect and commit
      writeChanges(dir, changes);
      base.status = "changed";
    } else {
      writeChanges(dir, changes);
      base.prUrl = await openPullRequest(dir, target, config);
      base.status = "changed";
    }
  } catch (err) {
    base.status = "failed";
    base.error = (err as Error).message;
  }

  base.ms = Date.now() - started;
  return base;
}
