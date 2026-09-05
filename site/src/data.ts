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

  // commands run in each repo after the transform, and their output lands
  // in the diff too - so the lockfile ships with the change that needs it
  run: [["npm", "install", "--package-lock-only"]],
};`;

/* ------------------------------------------------------------------ *
 * Company-site content
 *
 * Every claim below is true of the product as built. Nothing here
 * asserts a customer, a headcount, or a certification we do not have.
 * ------------------------------------------------------------------ */

export const VALUE_PROPS = [
  {
    icon: "calendar",
    title: "Deprecations land on the date you set",
    body:
      "The migration stops being fourteen teams' backlog item and becomes one pull " +
      "request each. Deadlines hold because the work is already done when the notice " +
      "goes out.",
  },
  {
    icon: "clock",
    title: "Weeks of mechanical work, in an afternoon",
    body:
      "One transform covers every call site in every repository. The engineer who owns " +
      "the API writes it once instead of shepherding a spreadsheet of migration tickets " +
      "across two quarters.",
  },
  {
    icon: "terminal",
    title: "Not just source files",
    body:
      "Transforms are text-level, so shell scripts, Dockerfiles, CI workflows and config " +
      "are all in reach. Commands run inside each repository too, so a lockfile, a " +
      "generated client or a formatter's pass ships in the same pull request as the " +
      "change that required it.",
  },
  {
    icon: "users",
    title: "Teams keep ownership of their code",
    body:
      "Rollout opens pull requests, never pushes to main. CI runs, the owning team " +
      "reviews and merges. You removed their work without taking their control.",
  },
] as const;

export const USE_CASES = [
  ["Dependency majors", "A library you depend on ships a breaking release. Move every repository onto it, lockfiles regenerated, in one pass."],
  ["CVE response", "A vulnerable pattern is disclosed on a Friday. Push the same fix into every repository carrying it before Monday."],
  ["API deprecation", "Retire an internal package or endpoint and migrate every caller in the week you announce it."],
  ["Toolchain and CI", "Roll a workflow, base image, Node version or lint rule across the estate - shell scripts and YAML included."],
  ["Platform policy", "Apply a required header, config or ownership file everywhere, with an auditable pull request per repository."],
  ["Namespace moves", "Rename a module or scope across hundreds of call sites without a week of merge conflicts."],
] as const;

export const TRUST = [
  ["Your code never leaves your machine", "Rollout runs locally or in your CI. There is no service to send repositories to, and no account to create."],
  ["No telemetry, ever", "Nothing is collected, phoned home, or logged externally. The tool has no network calls of its own beyond git and the GitHub API."],
  ["Zero runtime dependencies", "Rollout runs inside your CI; every dependency it carried would be one you inherited. It ships with none."],
  ["Nothing lands without review", "The unit of output is a pull request. CI runs and a human approves before a single line reaches a default branch."],
  ["Least privilege by default", "plan needs only read access to clone. Write credentials are required for apply, and nothing else."],
  ["Auditable by construction", "Every change arrives as a reviewable diff with a consistent title and body, so the migration has a paper trail per repository."],
] as const;

export const PLANS = [
  {
    name: "Open source",
    price: "Free",
    note: "MIT licensed, forever",
    cta: "Get started",
    href: "#install",
    featured: false,
    includes: [
      "Unlimited repositories",
      "Every transform helper",
      "plan and apply",
      "GitHub pull requests",
      "Runs locally and in CI",
      "Community support",
    ],
  },
  {
    name: "Team",
    price: "In development",
    note: "Tell us what you need",
    cta: "Register interest",
    href: "#contact",
    featured: true,
    includes: [
      "Everything in Open source",
      "Shared migration definitions",
      "Cross-repository progress tracking",
      "Scheduled and recurring rollouts",
      "GitHub Enterprise Server",
      "Priority support",
    ],
  },
  {
    name: "Enterprise",
    price: "Talk to us",
    note: "Self-hosted, on your terms",
    cta: "Start a conversation",
    href: "#contact",
    featured: false,
    includes: [
      "Everything in Team",
      "SSO and audit logging",
      "Custom transform development",
      "Migration design support",
      "SLA-backed response times",
      "Deployment review",
    ],
  },
] as const;

export const FAQ = [
  [
    "Does my source code get uploaded anywhere?",
    "No. Rollout is a command-line tool that runs on your machine or in your CI. Repositories are cloned locally, the transform runs in memory, and the only outbound calls are the git and GitHub operations you would make by hand.",
  ],
  [
    "What happens if a transform is wrong?",
    "You see it before anything is written. plan is the default and produces a full diff for every repository without touching them. apply re-runs that same plan and asks for confirmation. And because the output is a pull request, a wrong transform is caught in review rather than landing on sixty default branches.",
  ],
  [
    "Can it handle changes a regex cannot?",
    "Yes. A transform is a plain function from file contents to file contents, so you can run any parser or AST tool you like inside it. The bundled helpers cover the common renames; anything structural is a function you write.",
  ],
  [
    "Does it work with GitHub Enterprise or GitLab?",
    "Pull requests are opened through the GitHub CLI, so GitHub.com and GitHub Enterprise Server both work wherever gh is authenticated. GitLab and Bitbucket are not supported yet.",
  ],
  [
    "Why not just point a coding agent at each repository?",
    "Because a migration has to be identical everywhere, and an agent is non-deterministic by design. Sixty agent sessions produce sixty different diffs - each interpreting, reformatting and improving adjacent code differently - so every pull request needs a real review rather than a glance. Rollout applies byte-identical logic to every repository and shows the entire blast radius as one diff before it writes anything, so a reviewer approves the transform once instead of auditing sixty variations. It is also seconds rather than sixty long agent runs. The two compose well: use an agent to write the transform, which is genuinely creative one-time work, then use rollout to distribute it deterministically. Where each call site needs different judgement, an agent is the right tool and this is not.",
  ],
  [
    "Our codebase is new and consistent. Is this only for legacy code?",
    "Breaking changes do not come from your code being old. They come from outside it: a dependency major, a disclosed CVE, a cloud SDK version, an expiring API. A six-week-old estate of sixty repositories has the same problem as a ten-year-old one, because the trigger is fleet size, not age. Consistency actually helps - the hard part of a codemod is variance, so a uniform codebase gives a mechanical transform a higher clean-hit rate.",
  ],
  [
    "How is this different from Nx, Turborepo, or a codemod library?",
    "Those operate inside one repository. Rollout's unit of work is the organisation: many repositories, one change, one pull request each, with the review and approval flow that implies. It composes with codemod libraries rather than replacing them.",
  ],
  [
    "What does it cost?",
    "The tool is MIT licensed and free, with no limits on repositories or usage. Paid tiers are for teams who want shared migration definitions, progress tracking across repositories, and support.",
  ],
] as const;

/* ------------------------------------------------------------------ *
 * The differentiator, stated plainly.
 *
 * Determinism is the product. This belongs above the fold-line of the
 * argument, not buried in an FAQ.
 * ------------------------------------------------------------------ */

export const COMPARISON: { label: string; agent: string; rollout: string }[] = [
  {
    label: "What you review",
    agent: "Sixty different diffs, one per session",
    rollout: "One transform, then sixty identical applications of it",
  },
  {
    label: "Consistency",
    agent: "Varies by run — each session interprets the task again",
    rollout: "Byte-identical logic in every repository",
  },
  {
    label: "Blast radius",
    agent: "Discovered repo by repo, as it goes",
    rollout: "The entire plan as one diff, before anything is written",
  },
  {
    label: "Adjacent code",
    agent: "May reformat or improve whatever it touches",
    rollout: "Only what the transform matches. Nothing else moves",
  },
  {
    label: "Reproducibility",
    agent: "Re-running produces a different result",
    rollout: "Same input, same output, every time",
  },
  {
    label: "Time and cost",
    agent: "Sixty long agent runs, billed per token",
    rollout: "Seconds. No model calls in the path at all",
  },
];

export const TRIGGERS = [
  ["A dependency ships a major", "Nothing to do with how old your code is."],
  ["A CVE is disclosed", "The clock starts on Friday, for every repository at once."],
  ["A cloud SDK version lands", "Vendors deprecate on their schedule, not yours."],
  ["An API version expires", "External deadlines do not care who wrote the code."],
] as const;

/* ------------------------------------------------------------------ *
 * "Does it use AI?" and "is this for me?" - the two questions a buyer
 * asks that the page previously left unanswered.
 * ------------------------------------------------------------------ */

export const PIPELINE = [
  {
    stage: "You, or a coding agent",
    role: "Authors the transform",
    body:
      "Writing the transform is creative, one-time work, and a good use of Claude or " +
      "any agent. It happens once, on your machine, against one example.",
    ai: true,
  },
  {
    stage: "rollout",
    role: "Distributes it",
    body:
      "Applies that exact function to every repository. No model runs here. The same " +
      "input produces the same output on every repo and on every re-run.",
    ai: false,
  },
  {
    stage: "Your teams",
    role: "Review and merge",
    body:
      "One pull request per repository, all carrying the same diff shape. CI runs. " +
      "The owning team approves.",
    ai: false,
  },
];

export const AI_FACTS = [
  ["No model in the execution path", "Rollout makes no API calls to any model provider. There is no key to configure, and no inference step between your config and your diff."],
  ["Your code is never sent to a model", "Because nothing calls a model, nothing uploads a repository to one. This is usually the question that decides whether a security team approves a tool at all."],
  ["Bring an agent to author the transform", "Ask Claude to write the transform function against one example, review it once, then let rollout apply it identically everywhere. The judgement happens once, not sixty times."],
  ["Deterministic output, by construction", "A transform is a pure function over file contents. Given the same repository it produces the same diff today, in CI, and in six months."],
] as const;

export const FIT_YES = [
  ["Ten or more repositories", "The pain starts around a dozen. Below that, your editor's find-and-replace is genuinely faster."],
  ["Polyrepo, or several monorepos", "Rollout's unit of work is the repository. Inside a single monorepo, your existing codemod tooling already reaches everything."],
  ["A platform, infra or DX team", "Someone who owns a library or standard that other teams consume, and who is accountable for migrations landing."],
  ["Code hosted on GitHub", "Pull requests are opened through the GitHub CLI. GitHub.com and Enterprise Server both work."],
  ["Any text-based language", "Transforms operate on text, so Go, Python, Ruby, Java and Terraform are all in reach. The bundled helpers are JavaScript-shaped; everything else composes replace with run and your own toolchain."],
  ["Mechanical, uniform changes", "A rename, a version bump, a config rollout, a patched call signature - anything where the correct edit is the same in every repository."],
] as const;

export const FIT_NO = [
  ["A single repository", "Use jscodeshift, comby, ast-grep, or your editor. Rollout would add a layer for nothing."],
  ["Changes needing per-site judgement", "If each call site needs a different fix, a coding agent is the right tool and this is the wrong one."],
  ["GitLab or Bitbucket", "Not supported yet. Transforms still work against local paths; only pull request creation is GitHub-only."],
  ["Anything you cannot review", "Rollout is built for changes a human can approve as a diff. It is not an autonomous refactoring service."],
] as const;
