import {
  pipe,
  renameModule,
  renameSymbol,
  editJson,
  forExtensions,
} from "rollout-cli";

/**
 * A real migration: @acme/auth-legacy is deprecated, getUserSync became
 * getUser, and the dependency moves to a new major.
 */
export default {
  // "owner/name" opens a pull request. A local path is written in place and
  // left for you to inspect - useful while you are still tuning the transform.
  repos: [
    "acme/svc-billing",
    "acme/svc-users",
    "acme/svc-notifications",
    // "../svc-billing",
  ],

  branch: "rollout/drop-auth-legacy",
  title: "Migrate off @acme/auth-legacy",
  body: [
    "`@acme/auth-legacy` is deprecated and will be deleted on 1 December.",
    "",
    "This PR is the mechanical part of the migration:",
    "- `@acme/auth-legacy` -> `@acme/auth`",
    "- `getUserSync()` -> `getUser()`",
    "- dependency bumped to `^4.0.0`",
    "",
    "Opened by [rollout](https://github.com/payallenka/rollout). Reply here if anything looks wrong.",
  ].join("\n"),

  labels: ["migration"],

  include: ["**/*.ts", "**/*.tsx", "package.json"],
  exclude: ["**/*.generated.ts"],

  // Order matters: transforms are threaded through in sequence, so anything
  // that keys off the *old* name has to run before the rename that removes it.
  // editJson looks up "@acme/auth-legacy", so it goes first.
  transform: pipe(
    editJson("package.json", (pkg) => {
      const deps = pkg.dependencies;
      if (deps?.["@acme/auth-legacy"]) {
        delete deps["@acme/auth-legacy"];
        deps["@acme/auth"] = "^4.0.0";
      }
    }),
    forExtensions([".ts", ".tsx"], renameModule("@acme/auth-legacy", "@acme/auth")),
    forExtensions([".ts", ".tsx"], renameSymbol("getUserSync", "getUser")),
  ),
};
