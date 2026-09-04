/* A line-oriented unified diff.
 *
 * `plan` is the only thing standing between a one-line config change and a
 * hundred wrong pull requests, so the preview has to be a real diff rather
 * than a count of modified files. */

const enum Op { Keep, Del, Add }

interface Edit {
  op: Op;
  line: string;
}

/** Myers-style LCS over lines, adequate for source files. */
function lcsEdits(a: string[], b: string[]): Edit[] {
  const n = a.length;
  const m = b.length;

  // fall back to a whole-file replacement on pathological inputs rather than
  // allocating an n*m table
  if (n * m > 4_000_000) {
    return [
      ...a.map((line) => ({ op: Op.Del, line })),
      ...b.map((line) => ({ op: Op.Add, line })),
    ];
  }

  const table: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      table[i][j] = a[i] === b[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }

  const edits: Edit[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      edits.push({ op: Op.Keep, line: a[i] });
      i++; j++;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      edits.push({ op: Op.Del, line: a[i++] });
    } else {
      edits.push({ op: Op.Add, line: b[j++] });
    }
  }
  while (i < n) edits.push({ op: Op.Del, line: a[i++] });
  while (j < m) edits.push({ op: Op.Add, line: b[j++] });
  return edits;
}

export interface DiffLine {
  kind: "context" | "add" | "del" | "gap";
  text: string;
}

/** Unified diff with `context` lines around each hunk. */
export function diffLines(before: string, after: string, context = 2): DiffLine[] {
  const edits = lcsEdits(before.split("\n"), after.split("\n"));

  // mark which indices to keep: every change, plus `context` either side
  const keep = new Array<boolean>(edits.length).fill(false);
  edits.forEach((edit, i) => {
    if (edit.op === Op.Keep) return;
    for (let k = Math.max(0, i - context); k <= Math.min(edits.length - 1, i + context); k++) {
      keep[k] = true;
    }
  });

  const out: DiffLine[] = [];
  let skipped = 0;

  edits.forEach((edit, i) => {
    if (!keep[i]) { skipped++; return; }
    if (skipped > 0) {
      out.push({ kind: "gap", text: `... ${skipped} unchanged line${skipped === 1 ? "" : "s"}` });
      skipped = 0;
    }
    out.push({
      kind: edit.op === Op.Add ? "add" : edit.op === Op.Del ? "del" : "context",
      text: edit.line,
    });
  });

  return out;
}

export function countChangedLines(before: string, after: string): { added: number; removed: number } {
  const edits = lcsEdits(before.split("\n"), after.split("\n"));
  let added = 0;
  let removed = 0;
  for (const edit of edits) {
    if (edit.op === Op.Add) added++;
    else if (edit.op === Op.Del) removed++;
  }
  return { added, removed };
}
