import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative, sep } from "node:path";

/* A glob matcher and a file walker, in place of a dependency. Rollout runs
 * inside other people's CI; every dependency it carries is one they inherit. */

/** Converts a glob to an anchored regular expression. Supports *, **, ?, {a,b}. */
export function globToRegExp(glob: string): RegExp {
  let out = "";
  for (let i = 0; i < glob.length; i++) {
    const ch = glob[i];
    if (ch === "*") {
      if (glob[i + 1] === "*") {
        // `**/` matches zero or more directories, `**` matches anything
        if (glob[i + 2] === "/") {
          out += "(?:[^/]+/)*";
          i += 2;
        } else {
          out += ".*";
          i += 1;
        }
      } else {
        out += "[^/]*";
      }
      continue;
    }
    if (ch === "?") { out += "[^/]"; continue; }
    if (ch === "{") {
      const close = glob.indexOf("}", i);
      if (close > i) {
        const alts = glob.slice(i + 1, close).split(",").map(escape).join("|");
        out += `(?:${alts})`;
        i = close;
        continue;
      }
    }
    out += escape(ch);
  }
  return new RegExp(`^${out}$`);
}

function escape(s: string): string {
  return s.replace(/[.+^${}()|[\]\\]/g, "\\$&");
}

export function matchesAny(path: string, patterns: RegExp[]): boolean {
  return patterns.some((re) => re.test(path));
}

/** Directories never worth walking, whatever the config says. */
const ALWAYS_SKIP = new Set([
  ".git", "node_modules", "dist", "build", "out", ".next", ".turbo", ".cache",
  "vendor", "target", "__pycache__", ".venv", "venv", ".gradle", "coverage",
]);

const MAX_FILE_BYTES = 2 * 1024 * 1024;

export function walk(root: string): string[] {
  const found: string[] = [];

  const visit = (dir: string) => {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (entry.isSymbolicLink()) continue;
      const full = join(dir, entry.name);
      if (entry.isDirectory()) {
        if (ALWAYS_SKIP.has(entry.name)) continue;
        visit(full);
      } else if (entry.isFile()) {
        found.push(relative(root, full).split(sep).join("/"));
      }
    }
  };

  visit(root);
  return found;
}

/**
 * Reads a file as UTF-8, or returns null if it is binary or too large.
 * A transform that receives a binary blob as a string will corrupt it on write,
 * so the check happens here rather than being left to each transform.
 */
export function readTextFile(abs: string): string | null {
  let stats;
  try {
    stats = statSync(abs);
  } catch {
    return null;
  }
  if (!stats.isFile() || stats.size > MAX_FILE_BYTES) return null;

  const buf = readFileSync(abs);
  // a NUL byte in the first 8KB is the same heuristic git uses for "binary"
  const probe = buf.subarray(0, 8192);
  if (probe.includes(0)) return null;
  return buf.toString("utf8");
}
