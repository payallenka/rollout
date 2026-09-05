#!/usr/bin/env node
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { createInterface } from "node:readline/promises";
import { countChangedLines, diffLines } from "./diff.js";
import { has } from "./exec.js";
import { isLocal, normalizeTarget, pool, processRepo } from "./engine.js";
import type { RepoResult, RolloutConfig } from "./types.js";

const tty = process.stdout.isTTY && !process.env.NO_COLOR;
const c = {
  dim: (s: string) => (tty ? `\x1b[2m${s}\x1b[0m` : s),
  bold: (s: string) => (tty ? `\x1b[1m${s}\x1b[0m` : s),
  red: (s: string) => (tty ? `\x1b[31m${s}\x1b[0m` : s),
  green: (s: string) => (tty ? `\x1b[32m${s}\x1b[0m` : s),
  yellow: (s: string) => (tty ? `\x1b[33m${s}\x1b[0m` : s),
  cyan: (s: string) => (tty ? `\x1b[36m${s}\x1b[0m` : s),
};

const USAGE = `
${c.bold("rollout")} - make a breaking change once, get pull requests open on every repo that needs it

  ${c.bold("rollout plan")}    show the diff for every repository. Writes nothing.
  ${c.bold("rollout apply")}   commit, push, and open a pull request on each changed repository.

Options
  -c, --config <path>   config file (default: rollout.config.js)
  -r, --repo <name>     limit to one repository, repeatable
      --concurrency <n> repositories in flight at once (default 4)
      --full            print every changed file, not the first few
      --yes             skip the confirmation prompt on apply
      --help

A local path in ${c.bold("repos")} is written to in place and left for you to inspect;
only "owner/name" entries are ever pushed.
`;

interface Args {
  command: string;
  config: string;
  repos: string[];
  concurrency?: number;
  full: boolean;
  yes: boolean;
}

function parseArgs(argv: string[]): Args {
  const args: Args = { command: "", config: "rollout.config.js", repos: [], full: false, yes: false };

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--help" || a === "-h") { console.log(USAGE); process.exit(0); }
    else if (a === "-c" || a === "--config") args.config = argv[++i];
    else if (a === "-r" || a === "--repo") args.repos.push(argv[++i]);
    else if (a === "--concurrency") args.concurrency = Number(argv[++i]);
    else if (a === "--full") args.full = true;
    else if (a === "--yes" || a === "-y") args.yes = true;
    else if (!a.startsWith("-") && !args.command) args.command = a;
    else { console.error(`unknown option: ${a}`); process.exit(2); }
  }

  return args;
}

async function loadConfig(path: string): Promise<RolloutConfig> {
  const abs = resolve(path);
  if (!existsSync(abs)) {
    console.error(`no config at ${abs}\n\nCreate one, or point at it with --config. See ${c.cyan("rollout --help")}.`);
    process.exit(2);
  }

  const mod = (await import(pathToFileURL(abs).href)) as { default?: RolloutConfig };
  const config = mod.default;
  if (!config) {
    console.error(`${path} has no default export`);
    process.exit(2);
  }

  const missing = (["repos", "branch", "title"] as const).filter((k) => !config[k]);
  if (missing.length) {
    console.error(`${path} is missing: ${missing.join(", ")}`);
    process.exit(2);
  }
  if (!config.transform && !config.run?.length) {
    console.error(`${path}: needs a transform, a run list, or both - it makes no change otherwise`);
    process.exit(2);
  }
  if (config.transform && typeof config.transform !== "function") {
    console.error(`${path}: transform must be a function`);
    process.exit(2);
  }

  return config;
}

function renderRepo(result: RepoResult, full: boolean): void {
  const changedFiles = result.changes.length;

  if (result.status === "failed") {
    console.log(`${c.red("!")} ${c.bold(result.repo)} ${c.red(result.error ?? "failed")}`);
    return;
  }
  if (result.status === "unchanged") {
    console.log(`${c.dim("-")} ${c.dim(result.repo)} ${c.dim(`no match in ${result.filesScanned} files`)}`);
    return;
  }

  let added = 0;
  let removed = 0;
  for (const change of result.changes) {
    const counted = countChangedLines(change.before, change.after);
    added += counted.added;
    removed += counted.removed;
  }

  const stat = `${changedFiles} file${changedFiles === 1 ? "" : "s"}  ${c.green(`+${added}`)} ${c.red(`-${removed}`)}`;
  console.log(`${c.green("*")} ${c.bold(result.repo)}  ${stat}${result.prUrl ? `  ${c.cyan(result.prUrl)}` : ""}`);

  const shown = full ? result.changes : result.changes.slice(0, 3);
  for (const change of shown) {
    console.log(`  ${c.dim(change.path)}`);
    for (const line of diffLines(change.before, change.after)) {
      if (line.kind === "gap") console.log(`    ${c.dim(line.text)}`);
      else if (line.kind === "add") console.log(`    ${c.green(`+ ${line.text}`)}`);
      else if (line.kind === "del") console.log(`    ${c.red(`- ${line.text}`)}`);
      else console.log(`    ${c.dim(`  ${line.text}`)}`);
    }
  }
  if (!full && result.changes.length > shown.length) {
    console.log(`  ${c.dim(`... ${result.changes.length - shown.length} more files, use --full to see them`)}`);
  }
}

async function confirm(question: string): Promise<boolean> {
  if (!process.stdin.isTTY) return false;
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(question);
  rl.close();
  return answer.trim().toLowerCase() === "y";
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));

  if (!args.command) { console.log(USAGE); process.exit(0); }
  if (args.command !== "plan" && args.command !== "apply") {
    console.error(`unknown command: ${args.command}`);
    process.exit(2);
  }

  const config = await loadConfig(args.config);

  let targets = config.repos;
  if (args.repos.length) {
    const wanted = new Set(args.repos);
    targets = targets.filter((t) => wanted.has(normalizeTarget(t).repo));
    if (!targets.length) {
      console.error(`none of ${args.repos.join(", ")} are in the config`);
      process.exit(2);
    }
  }

  const remote = targets.filter((t) => !isLocal(normalizeTarget(t).repo));
  if (args.command === "apply" && remote.length && !(await has("gh"))) {
    console.error(
      `apply needs the GitHub CLI to open pull requests, and gh is not on PATH.\n` +
      `Install it from https://cli.github.com, or use local paths in repos to write changes in place.`,
    );
    process.exit(2);
  }

  console.log(
    `\n${c.bold(config.title)}\n` +
    `${c.dim(`${targets.length} repositor${targets.length === 1 ? "y" : "ies"}, branch ${config.branch}`)}\n`,
  );

  // apply always plans first, so the confirmation is shown against the real diff
  const planned = await pool(targets, args.concurrency ?? config.concurrency ?? 4, (t) =>
    processRepo(t, config, "plan"),
  );

  for (const result of planned) renderRepo(result, args.full);

  const changed = planned.filter((r) => r.status === "changed");
  const failed = planned.filter((r) => r.status === "failed");

  console.log(
    `\n${c.bold(`${changed.length} of ${planned.length}`)} repositories change` +
    (failed.length ? c.red(`, ${failed.length} failed`) : "") + ".",
  );

  if (args.command === "plan") {
    if (changed.length) {
      console.log(c.dim(`Nothing was written. Run ${c.bold("rollout apply")} to open the pull requests.\n`));
    }
    process.exit(failed.length ? 1 : 0);
  }

  if (!changed.length) {
    console.log(c.dim("Nothing to apply.\n"));
    process.exit(failed.length ? 1 : 0);
  }

  if (!args.yes) {
    const remoteCount = changed.filter((r) => !isLocal(r.repo)).length;
    const ok = await confirm(
      `\nOpen ${c.bold(String(remoteCount))} pull request${remoteCount === 1 ? "" : "s"}` +
      `${remoteCount !== changed.length ? ` and write ${changed.length - remoteCount} local repo(s)` : ""}? [y/N] `,
    );
    if (!ok) { console.log("Aborted. Nothing was written.\n"); process.exit(1); }
  }

  console.log("");
  const applied = await pool(changed, args.concurrency ?? config.concurrency ?? 4, (r) =>
    processRepo(
      config.repos.find((t) => normalizeTarget(t).repo === r.repo)!,
      config,
      "apply",
    ),
  );

  console.log("");
  for (const result of applied) {
    if (result.status === "failed") console.log(`${c.red("!")} ${c.bold(result.repo)} ${c.red(result.error ?? "")}`);
    else if (result.prUrl) console.log(`${c.green("*")} ${c.bold(result.repo)}  ${c.cyan(result.prUrl)}`);
    else console.log(`${c.green("*")} ${c.bold(result.repo)}  ${c.dim("written in place")}`);
  }

  const appliedFailures = applied.filter((r) => r.status === "failed").length;
  console.log(
    `\n${c.bold(String(applied.length - appliedFailures))} of ${applied.length} done.` +
    (appliedFailures ? c.red(` ${appliedFailures} failed.`) : "") + "\n",
  );
  process.exit(appliedFailures ? 1 : 0);
}

main().catch((err: unknown) => {
  console.error(c.red(`\n${(err as Error).message}\n`));
  process.exit(1);
});
