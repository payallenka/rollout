# rollout

Make a breaking change once, get pull requests open on every repo that needs it.

```bash
npx rollout-cli plan     # show the diff for every repo. Writes nothing.
npx rollout-cli apply    # commit, push, open a PR on each changed repo.
```

## The problem

You deprecate an internal API. Then you find 400 call sites across 60
repositories, owned by 14 teams. So the deprecation notice goes out, a
migration guide gets written, and two years later the old code path is still
there because nobody has a week to spend on other people's repos.

Every large engineering organisation solves this by building the tool
themselves — Google has Rosie, Meta has fastmod and Codemod, and most companies
past a few dozen repos have some half-finished script that does this badly.
Outside those walls there is no equivalent, so the API never dies.

`rollout` is that tool, as 700 lines and no service to run.

## How it works

A config file says which repositories to change and what the change is:

```js
import { pipe, renameModule, renameSymbol, editJson } from "rollout-cli";

export default {
  repos: ["acme/svc-billing", "acme/svc-users", "acme/svc-notifications"],
  branch: "rollout/drop-auth-legacy",
  title: "Migrate off @acme/auth-legacy",
  body: "The legacy auth package is removed on 1 December. This is the mechanical part.",
  include: ["**/*.ts", "package.json"],

  transform: pipe(
    editJson("package.json", (pkg) => {
      delete pkg.dependencies["@acme/auth-legacy"];
      pkg.dependencies["@acme/auth"] = "^4.0.0";
    }),
    renameModule("@acme/auth-legacy", "@acme/auth"),
    renameSymbol("getUserSync", "getUser"),
  ),
};
```

`rollout plan` shallow-clones each repository, applies the transform in memory,
and prints the diff. It writes nothing:

```
Migrate off @acme/auth-legacy
3 repositories, branch rollout/drop-auth-legacy

* acme/svc-billing  2 files  +5 -3
  src/charge.ts
    - import { getUserSync, chargeCard } from "@acme/auth-legacy";
    + import { getUser, chargeCard } from "@acme/auth";
      import { log } from "./log";
    -   const user = getUserSync(id);
    +   const user = getUser(id);
* acme/svc-users  2 files  +5 -3
- acme/svc-notifications  no match in 84 files

2 of 3 repositories change.
Nothing was written. Run rollout apply to open the pull requests.
```

`rollout apply` re-runs exactly that plan, then branches, commits, pushes, and
opens a pull request per repository through the `gh` CLI.

## Safety

The failure mode that matters is opening sixty wrong pull requests, so:

- **`plan` is the default and writes nothing.** `apply` re-plans and shows the
  same diff before it asks.
- **`apply` confirms interactively** unless you pass `--yes`.
- **Repositories with no match are skipped**, not committed empty.
- **Local paths are never pushed.** A path in `repos` is written in place and
  left uncommitted for you to read — the intended way to tune a transform
  before it touches anything remote.
- **`--force-with-lease`**, so a re-run cannot clobber a commit someone pushed
  onto the branch.
- **Commands are never passed through a shell**, so a branch name or repo slug
  from a config file cannot become an injection.
- Binary files, anything over 2MB, and `node_modules`, `dist`, `.git`, `vendor`
  and friends are never handed to a transform.

## Transform helpers

`transform` is just a function — `({ path, source, repo }) => string | null` —
so anything you can write in JavaScript is available, including a full AST pass
if you want to bring your own parser. These exist because the common cases
should not need a regex written against import syntax:

| Helper | Does |
|---|---|
| `renameModule(from, to)` | rewrites the module specifier in imports and requires |
| `renameSymbol(from, to)` | renames an imported symbol and its uses, only in files that import it |
| `addCallArgument(fn, arg)` | adds an argument to single-line calls that lack it |
| `replace(pattern, text)` | search and replace, string or RegExp |
| `editJson(file, fn)` | edits a JSON file through a callback |
| `forExtensions(exts, t)` | restricts a transform to certain file types |
| `onlyIn(predicate, t)` | restricts a transform by path |
| `pipe(...transforms)` | threads the source through each in order |

**Order matters in `pipe`.** Transforms run in sequence on the output of the
previous one, so anything keyed off the *old* name must run before the rename
that removes it. Putting `renameModule` before an `editJson` that looks up the
old package name means the `editJson` silently finds nothing.

## Scope

What this deliberately does not do:

- It does **not** understand your code. The helpers are text transforms with
  guards, not a type-aware refactor. For a rename that needs real semantics,
  write a `transform` that runs your own AST tool over `source`.
- It does **not** run your tests. A pull request that passes CI is CI's verdict,
  not this tool's — which is exactly why the unit of output is a pull request
  and not a push to main.
- It does **not** merge anything, and has no opinion about review.
- `editJson` reformats the whole file to two-space JSON. On a repository with
  unusual formatting that produces a noisy diff; use `replace` instead there.

## Install

```bash
npm i -g rollout-cli    # or npx rollout-cli
```

Needs Node 20+, `git`, and — for `apply` against GitHub — the
[`gh` CLI](https://cli.github.com), authenticated. `plan` needs neither `gh`
nor any credential beyond read access to clone.

## Licence

MIT.
