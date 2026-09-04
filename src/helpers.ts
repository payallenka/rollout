import type { FileContext, Transform } from "./types.js";

/* The migrations people actually run, as composable transforms.
 *
 * A raw `transform` is always available for anything else - these exist
 * because the common cases should not require anyone to write a regular
 * expression against import syntax at 2am. */

/** Runs transforms in order, threading the source through each. */
export function pipe(...transforms: Transform[]): Transform {
  return (file: FileContext) => {
    let source = file.source;
    let touched = false;
    for (const transform of transforms) {
      const next = transform({ ...file, source });
      if (next != null && next !== source) {
        source = next;
        touched = true;
      }
    }
    return touched ? source : null;
  };
}

/** Applies a transform only to files whose path matches a predicate. */
export function onlyIn(test: (path: string) => boolean, transform: Transform): Transform {
  return (file) => (test(file.path) ? transform(file) : null);
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Rewrites the module specifier of an import or require.
 *
 *   renameModule("@acme/auth-legacy", "@acme/auth")
 */
export function renameModule(from: string, to: string): Transform {
  const quoted = new RegExp(`(['"\`])${escapeRe(from)}\\1`, "g");
  return ({ source }) => {
    const next = source.replace(quoted, (_m, q: string) => `${q}${to}${q}`);
    return next === source ? null : next;
  };
}

/**
 * Renames an imported symbol and every use of it.
 *
 *   renameSymbol("getUserSync", "getUser")
 *
 * Word-boundary anchored, and it skips a file that never imports the symbol,
 * so an unrelated local of the same name in another file is left alone.
 */
export function renameSymbol(from: string, to: string, opts: { requireImport?: boolean } = {}): Transform {
  const word = new RegExp(`\\b${escapeRe(from)}\\b`, "g");
  const imported = new RegExp(`\\b${escapeRe(from)}\\b[^\\n]*\\bfrom\\b|\\bfrom\\b[^\\n]*\\b${escapeRe(from)}\\b`);
  return ({ source }) => {
    if (opts.requireImport !== false && !imported.test(source)) return null;
    const next = source.replace(word, to);
    return next === source ? null : next;
  };
}

/**
 * Adds an argument to every call of a function that does not already have it.
 *
 *   addCallArgument("fetchUser", "{ signal }")
 *
 * Only handles single-line calls; anything nested or multi-line is left for a
 * hand-written transform, which is the honest boundary for a regex.
 */
export function addCallArgument(fn: string, arg: string): Transform {
  const call = new RegExp(`\\b${escapeRe(fn)}\\(([^()\\n]*)\\)`, "g");
  return ({ source }) => {
    const next = source.replace(call, (match, args: string) => {
      if (args.includes(arg)) return match;
      const inner = args.trim();
      return `${fn}(${inner ? `${inner}, ${arg}` : arg})`;
    });
    return next === source ? null : next;
  };
}

/** Plain search and replace, on a string or a regular expression. */
export function replace(pattern: string | RegExp, replacement: string): Transform {
  const re =
    typeof pattern === "string"
      ? new RegExp(escapeRe(pattern), "g")
      : pattern.global
        ? pattern
        : new RegExp(pattern.source, `${pattern.flags}g`);
  return ({ source }) => {
    const next = source.replace(re, replacement);
    return next === source ? null : next;
  };
}

/**
 * Edits a JSON file through a callback, preserving two-space formatting.
 *
 *   editJson("package.json", (pkg) => { pkg.engines = { node: ">=20" }; })
 */
export function editJson(
  file: string,
  edit: (value: Record<string, unknown>) => void,
): Transform {
  return ({ path, source }) => {
    if (path !== file) return null;
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(source) as Record<string, unknown>;
    } catch {
      return null;
    }
    edit(parsed);
    const trailingNewline = source.endsWith("\n") ? "\n" : "";
    const next = JSON.stringify(parsed, null, 2) + trailingNewline;
    return next === source ? null : next;
  };
}

/** Restricts a transform to a set of file extensions. */
export function forExtensions(extensions: string[], transform: Transform): Transform {
  const set = new Set(extensions.map((e) => (e.startsWith(".") ? e : `.${e}`)));
  return onlyIn((path) => set.has(path.slice(path.lastIndexOf("."))), transform);
}
