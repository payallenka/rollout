import { useEffect, useRef, useState, type ReactNode } from "react";
import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { Check, Copy } from "lucide-react";

/** A thin progress rule. It is the only chrome that tracks scroll, which is
 *  what keeps it reading as an instrument rather than an effect. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 26, restDelta: 0.001 });
  return <motion.div className="progress" style={{ scaleX }} aria-hidden />;
}

/**
 * Sections rise into place as they arrive, but always from a visible resting
 * state - the page is complete in its first frame for anyone who lands
 * mid-page or screenshots it.
 */
export function Reveal({
  children,
  delay = 0,
  as = "div",
  className,
}: {
  children: ReactNode;
  delay?: number;
  as?: "div" | "section";
  className?: string;
}) {
  const reduced = useReducedMotion();
  const Comp = as === "section" ? motion.section : motion.div;

  if (reduced) {
    const Plain = as === "section" ? "section" : "div";
    return <Plain className={className}>{children}</Plain>;
  }

  return (
    <Comp
      className={className}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </Comp>
  );
}

/** Copies a command. Failure says what to do instead of failing silently -
 *  the clipboard API is unavailable over plain http and inside some embeds. */
export function CopyCommand({ command }: { command: string }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(command);
      setState("copied");
    } catch {
      setState("failed");
    }
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setState("idle"), 1700);
  };

  return (
    <motion.button
      type="button"
      className="cmd"
      onClick={copy}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 420, damping: 30 }}
      aria-label={`Copy: ${command}`}
    >
      <span>
        <span className="sigil" aria-hidden>$</span> {command}
      </span>
      <span className="hint">
        {state === "copied" ? (
          <><Check size={12} aria-hidden /> copied</>
        ) : state === "failed" ? (
          "select and copy"
        ) : (
          <><Copy size={12} aria-hidden /> copy</>
        )}
      </span>
    </motion.button>
  );
}

/** True once the page has scrolled past the header's own height. */
export function useStuck(threshold = 8): boolean {
  const [stuck, setStuck] = useState(false);
  useEffect(() => {
    const onScroll = () => setStuck(window.scrollY > threshold);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);
  return stuck;
}

/** The mark: one source fanning out into three pull requests. */
export function Glyph({ size = 18 }: { size?: number }) {
  return (
    <svg className="glyph" width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <g stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
        <path d="M8 16h4" />
        <path d="M12 16c4 0 4-7 8-7" />
        <path d="M12 16h8" />
        <path d="M12 16c4 0 4 7 8 7" />
      </g>
      <g fill="currentColor">
        <circle cx="7" cy="16" r="2.6" />
        <circle cx="22" cy="9" r="2.4" />
        <circle cx="22" cy="16" r="2.4" />
        <circle cx="22" cy="23" r="2.4" />
      </g>
    </svg>
  );
}
