import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { APPLY, PLAN, type Line } from "../data";

const TABS = [
  { id: "plan", label: "rollout plan", lines: PLAN },
  { id: "apply", label: "rollout apply", lines: APPLY },
] as const;

type TabId = (typeof TABS)[number]["id"];

/**
 * The demo. For a CLI the terminal is the product, so it prints line by line
 * the way the real command does - and the two tabs answer the question the
 * hero raises, which is what `apply` actually does once you trust `plan`.
 */
export function Terminal() {
  const [tab, setTab] = useState<TabId>("plan");
  const reduced = useReducedMotion();
  const active = TABS.find((t) => t.id === tab)!;

  return (
    <div className="term">
      <div className="term-chrome">
        <span className="pip" aria-hidden />
        <span className="pip" aria-hidden />
        <span className="pip" aria-hidden />

        <div className="tabs" role="tablist" aria-label="Command">
          {TABS.map((t) => (
            <button
              key={t.id}
              role="tab"
              type="button"
              className="tab"
              data-active={t.id === tab}
              aria-selected={t.id === tab}
              onClick={() => setTab(t.id)}
            >
              {t.id === tab && (
                <motion.span
                  layoutId="tab-pill"
                  className="tab-pill"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              {t.label}
            </button>
          ))}
        </div>

        <span className="term-hint">
          {tab === "plan" ? "writes nothing" : "after you confirm"}
        </span>
      </div>

      <div className="term-body">
        <AnimatePresence mode="wait">
          <Transcript key={tab} lines={active.lines} reduced={!!reduced} />
        </AnimatePresence>
      </div>
    </div>
  );
}

function Transcript({ lines, reduced }: { lines: Line[]; reduced: boolean }) {
  const printed = usePrinter(lines.length, reduced);

  return (
    <motion.pre
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.16 }}
      aria-label="Example command output"
    >
      {lines.map((line, i) => (
        <span key={i} style={{ opacity: i < printed ? 1 : 0 }}>
          {line.map((seg, j) => (
            <span key={j} className={seg.c ? `t-${seg.c}` : undefined}>
              {seg.t}
            </span>
          ))}
          {i === printed - 1 && printed < lines.length ? <span className="caret" /> : null}
          {"\n"}
        </span>
      ))}
    </motion.pre>
  );
}

/**
 * Reveals lines on a timer rather than per-line CSS delays, so switching tabs
 * restarts cleanly. Reduced motion gets the whole transcript immediately.
 */
function usePrinter(total: number, reduced: boolean): number {
  const [count, setCount] = useState(reduced ? total : 0);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => {
    if (reduced) {
      setCount(total);
      return;
    }
    setCount(0);
    let i = 0;
    timer.current = window.setInterval(() => {
      i += 1;
      setCount(i);
      if (i >= total) window.clearInterval(timer.current);
    }, 46);
    return () => window.clearInterval(timer.current);
  }, [total, reduced]);

  return count;
}

/** Syntax-coloured config sample. Hand-tokenised: it is one fixed snippet, and
 *  a highlighter would be a dependency for a single block of code. */
export function ConfigBlock({ code }: { code: string }) {
  const parts = useMemo(() => tokenize(code), [code]);
  return (
    <div className="code">
      <pre>
        {parts.map((p, i) => (
          <span key={i} className={p.c}>{p.t}</span>
        ))}
      </pre>
    </div>
  );
}

const KEYWORDS = /\b(import|from|export|default|delete|const|return)\b/;

function tokenize(code: string): { t: string; c?: string }[] {
  const out: { t: string; c?: string }[] = [];

  for (const raw of code.split(/(\n)/)) {
    if (raw === "\n") { out.push({ t: "\n" }); continue; }
    if (raw.trimStart().startsWith("//")) { out.push({ t: raw, c: "c-com" }); continue; }

    // strings first, so a keyword inside a string is not recoloured
    let rest = raw;
    while (rest.length) {
      const str = /"[^"]*"/.exec(rest);
      const kw = KEYWORDS.exec(rest);

      if (str && (!kw || str.index < kw.index)) {
        if (str.index) out.push({ t: rest.slice(0, str.index) });
        out.push({ t: str[0], c: "c-str" });
        rest = rest.slice(str.index + str[0].length);
      } else if (kw) {
        if (kw.index) out.push({ t: rest.slice(0, kw.index) });
        out.push({ t: kw[0], c: "c-key" });
        rest = rest.slice(kw.index + kw[0].length);
      } else {
        out.push({ t: rest });
        break;
      }
    }
  }

  return out;
}
