import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Terminal, ConfigBlock } from "./components/Terminal";
import { CopyCommand, Glyph, Reveal, ScrollProgress, useStuck } from "./components/ui";
import { ANSWERS, CONFIG_SNIPPET, GUARDS, HELPERS, SCOPE, STEPS } from "./data";

const NAV = [
  ["Problem", "#problem"],
  ["How it works", "#how"],
  ["Safety", "#safety"],
  ["Transforms", "#helpers"],
  ["Install", "#install"],
] as const;

export default function App() {
  return (
    <>
      <ScrollProgress />
      <a className="skip" href="#main">Skip to content</a>
      <TopBar />
      <main id="main">
        <Hero />
        <Answers />
        <Problem />
        <How />
        <Safety />
        <Helpers />
        <Scope />
        <Install />
      </main>
      <Footer />
    </>
  );
}

function TopBar() {
  const stuck = useStuck();
  return (
    <header className="topbar" data-stuck={stuck}>
      <div className="wrap topbar-inner">
        <a className="wordmark" href="#top">
          <Glyph />
          rollout
        </a>
        <nav className="topnav" aria-label="Sections">
          {NAV.map(([label, href]) => (
            <a key={href} href={href}>{label}</a>
          ))}
        </nav>
      </div>
    </header>
  );
}

/* The hero enters as one sequence rather than five independent fades - the
 * difference between a page that assembles and a page that twitches. */
function Hero() {
  const reduced = useReducedMotion();
  const seq = {
    hidden: {},
    show: { transition: { staggerChildren: reduced ? 0 : 0.075, delayChildren: 0.04 } },
  };
  const item = reduced
    ? { hidden: {}, show: {} }
    : {
        hidden: { opacity: 0, y: 12 },
        show: { opacity: 1, y: 0, transition: { duration: 0.62, ease: [0.16, 1, 0.3, 1] as const } },
      };

  return (
    <section id="top" className="hero-host flush">
      <div className="hero-glow" aria-hidden />
      <motion.div className="wrap hero" variants={seq} initial="hidden" animate="show">
        <motion.span className="status" variants={item}>
          <span className="dot" aria-hidden />
          Pre-release &middot; not yet published to npm
        </motion.span>

        <motion.h1 variants={item}>
          Make a breaking change once. Get <em>pull requests</em> open on every repo that needs it.
        </motion.h1>

        <motion.p className="hero-sub" variants={item}>
          You deprecated an internal API. It is called in 400 places across 60 repositories
          owned by 14 teams. Rollout writes the change once, shows you every diff, and opens
          the pull requests.
        </motion.p>

        <motion.div className="cmds" variants={item}>
          <CopyCommand command="npx rollout-cli plan" />
          <a className="ghost" href="#how">
            See how it works <ArrowRight size={14} aria-hidden />
          </a>
        </motion.div>

        <motion.div variants={item}>
          <Terminal />
        </motion.div>
      </motion.div>
    </section>
  );
}

/* The four questions a reader has in the first thirty seconds, answered before
 * they have to scroll for them. */
function Answers() {
  return (
    <section aria-label="At a glance">
      <div className="answers">
        {ANSWERS.map((a, i) => (
          <Reveal key={a.q} className="answer" delay={i * 0.05}>
            <span className="q">{a.q}</span>
            <span className="a">{emphasise(a.a, a.strong)}</span>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

function emphasise(text: string, strong: string) {
  const at = text.indexOf(strong);
  if (at < 0) return text;
  return (
    <>
      {text.slice(0, at)}
      <strong>{strong}</strong>
      {text.slice(at + strong.length)}
    </>
  );
}

function Problem() {
  return (
    <section id="problem">
      <div className="wrap sec">
        <Reveal>
          <span className="eyebrow">The problem</span>
        </Reveal>
        <Reveal delay={0.05}>
          <h2>The change takes ten minutes. Finishing it takes two years.</h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="lede prose">
            Renaming a function in a library you own is trivial. Then you find every place
            it is called.
          </p>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="figures">
            {[
              ["400", "call sites to migrate"],
              ["60", "repositories they live in"],
              ["14", "teams who own those repos"],
            ].map(([n, l]) => (
              <div className="figure" key={n}>
                <div className="n">{n}</div>
                <div className="l">{l}</div>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.2}>
          <div className="prose stack">
            <p className="body">
              So you do what everyone does: send a deprecation notice, write a migration
              guide, set a deadline. Then nothing happens &mdash; because the work is not
              your team&rsquo;s, it is fourteen other teams&rsquo;, and it is never the most
              important thing on anyone&rsquo;s board. The deadline slips. You keep the old
              path alive &ldquo;just until Q3.&rdquo;
            </p>
            <p className="body">
              The cost was never the migration. It is that <strong>the old thing never
              dies</strong>: permanent maintenance, permanent test surface, and a permanent
              trap for whoever joins next.
            </p>
            <p className="body">
              Google built Rosie for exactly this. Meta built fastmod. They built them
              because they hit the problem hardest and earliest &mdash; and every company
              past a few dozen repositories hits it eventually, usually solving it with a
              half-finished shell script nobody trusts enough to run.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function How() {
  return (
    <section id="how">
      <div className="wrap sec">
        <Reveal><span className="eyebrow">How it works</span></Reveal>
        <Reveal delay={0.05}>
          <h2>One person&rsquo;s ten-minute job, instead of fourteen teams&rsquo; backlog item.</h2>
        </Reveal>

        <Reveal delay={0.1}>
          <div className="steps prose">
            {STEPS.map((s) => (
              <div className="step" key={s.n}>
                <div className="num">{s.n}</div>
                <div>
                  <h3>{s.title}</h3>
                  <p className="body">{s.body}</p>
                </div>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.15}>
          <ConfigBlock code={CONFIG_SNIPPET} />
        </Reveal>
        <Reveal delay={0.2}>
          <p className="small prose">
            Transforms run in sequence on each other&rsquo;s output, so anything keyed off
            the old name must run before the rename that removes it. That is why{" "}
            <code>editJson</code> comes first here.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function Safety() {
  return (
    <section id="safety">
      <div className="wrap sec">
        <Reveal><span className="eyebrow">Safety</span></Reveal>
        <Reveal delay={0.05}>
          <h2>The failure mode that matters is sixty wrong pull requests.</h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="lede prose">
            Every default is set against that, because a tool you do not trust on sixty
            repositories is a tool you will run on none.
          </p>
        </Reveal>
        <Reveal delay={0.15}>
          <dl className="guards prose">
            {GUARDS.map(([term, detail]) => (
              <div className="guard" key={term}>
                <dt>{term}</dt>
                <dd>{detail}</dd>
              </div>
            ))}
          </dl>
        </Reveal>
      </div>
    </section>
  );
}

function Helpers() {
  return (
    <section id="helpers">
      <div className="wrap sec">
        <Reveal><span className="eyebrow">Transforms</span></Reveal>
        <Reveal delay={0.05}>
          <h2>The common migrations, without writing a regex against import syntax.</h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="lede prose">
            <code>transform</code> is just{" "}
            <code>{"({ path, source, repo }) => string | null"}</code>. These exist so the
            ordinary cases do not need one.
          </p>
        </Reveal>
        <Reveal delay={0.15}>
          <div className="tablewrap">
            <table>
              <thead>
                <tr>
                  <th scope="col">Helper</th>
                  <th scope="col">What it does</th>
                </tr>
              </thead>
              <tbody>
                {HELPERS.map(([fn, desc]) => (
                  <tr key={fn}>
                    <td className="fn"><code>{fn}</code></td>
                    <td className="desc">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Scope() {
  return (
    <section id="scope">
      <div className="wrap sec">
        <Reveal><span className="eyebrow">Scope</span></Reveal>
        <Reveal delay={0.05}><h2>What it deliberately does not do.</h2></Reveal>
        <Reveal delay={0.1}>
          <ul className="bounds prose">
            {SCOPE.map((s) => (
              <li className="bound" key={s}>
                <span className="mark" aria-hidden>&mdash;</span>
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}

function Install() {
  return (
    <section id="install">
      <div className="wrap sec">
        <Reveal><span className="eyebrow">Install</span></Reveal>
        <Reveal delay={0.05}><h2>Node 20 or newer, git, and the GitHub CLI.</h2></Reveal>
        <Reveal delay={0.1}>
          <div className="cmds">
            <CopyCommand command="npm i -g rollout-cli" />
          </div>
        </Reveal>
        <Reveal delay={0.15}>
          <p className="body prose">
            <code>apply</code> needs <a href="https://cli.github.com">gh</a> authenticated to
            open the pull requests. <code>plan</code> needs neither <code>gh</code> nor any
            credential beyond read access to clone &mdash; so you can see exactly what a
            migration would do before granting anything write access.
          </p>
        </Reveal>
        <Reveal delay={0.2}>
          <p className="small prose">
            Zero runtime dependencies. Rollout runs inside other people&rsquo;s CI; every
            dependency it carried would be one they inherited.
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer>
      <div className="wrap footer-inner">
        <span className="mono">rollout</span>
        <span>MIT licensed</span>
        <span>Pre-release &mdash; the npm package is not published yet</span>
      </div>
    </footer>
  );
}
