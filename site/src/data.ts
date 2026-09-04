/* Terminal transcripts.
 *
 * These are the real shapes rollout prints - the plan output is taken from an
 * actual run against three repositories, with the repo names changed. Writing
 * them as segments rather than escaped ANSI keeps the colours under the
 * theme's control. */

export type Tone = "dim" | "add" | "del" | "accent" | "bold";
export type Seg = { t: string; c?: Tone };
export type Line = Seg[];

export const PLAN: Line[] = [
  [{ t: "$ ", c: "dim" }, { t: "rollout plan" }],
  [],
  [{ t: "Migrate off @acme/auth-legacy", c: "bold" }],
  [{ t: "3 repositories, branch rollout/drop-auth-legacy", c: "dim" }],
  [],
  [
    { t: "*", c: "add" }, { t: " " },
    { t: "acme/svc-billing", c: "bold" },
    { t: "  2 files  " }, { t: "+5", c: "add" }, { t: " " }, { t: "-3", c: "del" },
  ],
  [{ t: "  src/charge.ts", c: "dim" }],
  [{ t: '    - import { getUserSync, chargeCard } from "@acme/auth-legacy";', c: "del" }],
  [{ t: '    + import { getUser, chargeCard } from "@acme/auth";', c: "add" }],
  [{ t: '      import { log } from "./log";', c: "dim" }],
  [{ t: "      ... 3 unchanged lines", c: "dim" }],
  [{ t: "    -   const user = getUserSync(id);", c: "del" }],
  [{ t: "    +   const user = getUser(id);", c: "add" }],
  [{ t: "  package.json", c: "dim" }],
  [{ t: '    -   "@acme/auth-legacy": "^3.0.0"', c: "del" }],
  [{ t: '    +   "@acme/auth": "^4.0.0"', c: "add" }],
  [
    { t: "*", c: "add" }, { t: " " },
    { t: "acme/svc-users", c: "bold" },
    { t: "  2 files  " }, { t: "+5", c: "add" }, { t: " " }, { t: "-3", c: "del" },
  ],
  [{ t: "- acme/svc-notifications  no match in 84 files", c: "dim" }],
  [],
  [{ t: "2 of 3", c: "bold" }, { t: " repositories change." }],
  [
    { t: "Nothing was written. Run ", c: "dim" },
    { t: "rollout apply", c: "accent" },
    { t: " to open the pull requests.", c: "dim" },
  ],
];

export const APPLY: Line[] = [
  [{ t: "$ ", c: "dim" }, { t: "rollout apply" }],
  [],
  [{ t: "Migrate off @acme/auth-legacy", c: "bold" }],
  [{ t: "3 repositories, branch rollout/drop-auth-legacy", c: "dim" }],
  [],
  [{ t: "2 of 3", c: "bold" }, { t: " repositories change." }],
  [],
  [{ t: "Open 2 pull requests? [y/N] ", c: "dim" }, { t: "y", c: "accent" }],
  [],
  [
    { t: "*", c: "add" }, { t: " " },
    { t: "acme/svc-billing", c: "bold" },
    { t: "  https://github.com/acme/svc-billing/pull/1284", c: "accent" },
  ],
  [
    { t: "*", c: "add" }, { t: " " },
    { t: "acme/svc-users", c: "bold" },
    { t: "  https://github.com/acme/svc-users/pull/903", c: "accent" },
  ],
  [],
  [{ t: "2 of 2", c: "bold" }, { t: " done." }],
];

export const ANSWERS = [
  {
    q: "What is it",
    a: "A command-line tool that applies one code change across many repositories and opens a pull request on each.",
    strong: "one code change across many repositories",
  },
  {
    q: "Who it is for",
    a: "Platform and infrastructure teams who own a library other teams depend on and cannot finish deprecating.",
    strong: "other teams depend on",
  },
  {
    q: "Is it safe",
    a: "Nothing is written by default. plan shows every diff, and apply confirms before it pushes anything.",
    strong: "Nothing is written by default.",
  },
  {
    q: "What it costs",
    a: "Free and MIT licensed. No account, no service, no telemetry, and zero runtime dependencies.",
    strong: "Free and MIT licensed.",
  },
];

export const STEPS = [
  {
    n: "01",
    title: "Write the change once",
    body:
      "A config names the repositories and the transform. The transform is a plain " +
      "function over file contents, so anything you can write in JavaScript is " +
      "available — including your own AST pass.",
  },
  {
    n: "02",
    title: "plan shows you every diff",
    body:
      "Rollout shallow-clones each repository, applies the transform in memory, and " +
      "prints the result. It writes nothing. Repositories that do not use the API are " +
      "skipped, not committed empty.",
  },
  {
    n: "03",
    title: "apply opens the pull requests",
    body:
      "The same plan, re-run: branch, commit, push, and one pull request per repository " +
      "through the gh CLI, each carrying the same explanation. The owning teams still " +
      "review and merge — you have not taken their ownership, you have removed their work.",
  },
];

export const GUARDS = [
  ["plan is the default", "It writes nothing at all. apply re-runs the same plan and shows the same diff before it asks."],
  ["apply confirms", "Interactively, against the real diff, unless you pass --yes in CI."],
  ["local paths never push", "A path in repos is written in place and left uncommitted for you to read — the intended way to tune a transform before it touches anything remote."],
  ["--force-with-lease", "A re-run cannot clobber a commit somebody pushed onto the branch in the meantime."],
  ["no shell, ever", "Commands take argument arrays, so a branch name or repository slug from a config file cannot become an injection."],
  ["nothing binary", "Binaries, files over 2 MB, and node_modules, dist, .git, vendor and friends are never handed to a transform."],
  ["a PR, not a push", "CI runs and a human reviews. A bad transform gets caught sixty times instead of landing sixty times."],
] as const;

export const HELPERS = [
  ["renameModule", "Rewrites the module specifier in imports and requires"],
  ["renameSymbol", "Renames an imported symbol and its uses, only in files that import it"],
  ["addCallArgument", "Adds an argument to single-line calls that lack it"],
  ["replace", "Search and replace, string or RegExp"],
  ["editJson", "Edits a JSON file through a callback"],
  ["forExtensions", "Restricts a transform to certain file types"],
  ["onlyIn", "Restricts a transform by path predicate"],
  ["pipe", "Threads the source through each transform in order"],
] as const;

export const SCOPE = [
  "It does not understand your code. The helpers are guarded text transforms, not a type-aware refactor. For a rename needing real semantics, run your own AST tool inside a transform.",
  "It does not run your tests. A pull request that passes CI is CI's verdict, not this tool's — which is exactly why the unit of output is a pull request.",
  "It does not merge anything, and has no opinion about review.",
  "editJson reformats the file to two-space JSON. On a repository with unusual formatting that is a noisy diff — use replace there.",
];

export const CONFIG_SNIPPET = `// rollout.config.js
import { pipe, renameModule, renameSymbol, editJson } from "rollout-cli";

export default {
  repos:  ["acme/svc-billing", "acme/svc-users", "acme/svc-notifications"],
  branch: "rollout/drop-auth-legacy",
  title:  "Migrate off @acme/auth-legacy",
  body:   "The legacy auth package is removed on 1 December.",

  include: ["**/*.ts", "package.json"],

  transform: pipe(
    editJson("package.json", (pkg) => {
      delete pkg.dependencies["@acme/auth-legacy"];
      pkg.dependencies["@acme/auth"] = "^4.0.0";
    }),
    renameModule("@acme/auth-legacy", "@acme/auth"),
    renameSymbol("getUserSync", "getUser"),
  ),
};`;
