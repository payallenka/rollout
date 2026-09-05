import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight, Check, GitPullRequest, Minus, ShieldCheck, X,
} from "lucide-react";
import { Terminal, ConfigBlock } from "./components/Terminal";
import {
  CopyCommand, CountUp, Glyph, Reveal, ScrollProgress, Stagger,
  staggerItem, useActiveSection, useHeroParallax, useStuck,
} from "./components/ui";
import {
  AI_FACTS, COMPARISON, CONFIG_SNIPPET, FAQ, FIT_NO, FIT_YES, GUARDS,
  HELPERS, PIPELINE, PLANS, TRIGGERS, TRUST,
} from "./data";

/* The page argues one thing: a migration has to be identical everywhere, and
 * that is a determinism problem rather than an intelligence problem. Every
 * section below is a step in that argument, in order. */
const NAV = [
  ["The problem", "#problem"],
  ["Determinism", "#determinism"],
  ["How it works", "#how"],
  ["Who it's for", "#fit"],
  ["Pricing", "#pricing"],
] as const;

export default function App() {
  return (
    <>
      <ScrollProgress />
      <a className="skip" href="#main">Skip to content</a>
      <TopBar />
      <main id="main">
        <Hero />
        <Credibility />
        <Problem />
        <Determinism />
        <How />
        <Reach />
        <Fit />
        <Security />
        <Pricing />
        <Faq />
        <CtaBand />
      </main>
      <Footer />
    </>
  );
}

/* ------------------------------------------------------------------ */

function TopBar() {
  const stuck = useStuck();
  const active = useActiveSection(NAV.map(([, href]) => href.slice(1)));

  return (
    <header className="topbar" data-stuck={stuck}>
      <div className="wrap topbar-inner">
        <a className="wordmark" href="#top">
          <Glyph />
          rollout
        </a>

        <nav className="topnav" aria-label="Sections">
          {NAV.map(([label, href]) => {
            const isActive = active === href.slice(1);
            return (
              <a key={href} href={href} data-active={isActive} aria-current={isActive ? "true" : undefined}>
                {label}
                {isActive && (
                  <motion.span
                    layoutId="nav-underline"
                    className="nav-underline"
                    transition={{ type: "spring", stiffness: 400, damping: 34 }}
                  />
                )}
              </a>
            );
          })}
        </nav>

        <div className="topcta">
          <a className="btn btn-ghost" href="#install">Docs</a>
          <a className="btn btn-primary" href="#install">
            Get started <ArrowRight size={14} aria-hidden />
          </a>
        </div>
      </div>
    </header>
  );
}

function Hero() {
  const reduced = useReducedMotion();
  const parallax = useHeroParallax();

  const seq = {
    hidden: {},
    show: { transition: { staggerChildren: reduced ? 0 : 0.07, delayChildren: 0.04 } },
  };
  const item = reduced
    ? { hidden: {}, show: {} }
    : {
        hidden: { opacity: 0, y: 12 },
        show: { opacity: 1, y: 0, transition: { duration: 0.62, ease: [0.16, 1, 0.3, 1] as const } },
      };

  return (
    <section id="top" className="hero-host flush">
      <motion.div className="hero-glow" style={parallax} aria-hidden />
      <motion.div className="wrap hero" variants={seq} initial="hidden" animate="show">
        <motion.span className="eyebrow hero-eyebrow" variants={item}>
          Deterministic migration across every repository
        </motion.span>

        <motion.h1 variants={item}>
          The same change. <em>Every repository.</em> Reviewed once.
        </motion.h1>

        <motion.p className="hero-sub" variants={item}>
          A migration has to be identical everywhere, which makes it a determinism
          problem, not an intelligence one. Rollout applies one transform across your
          whole estate, shows you the entire blast radius as a single diff, then opens
          a pull request on each repository.
        </motion.p>

        <motion.div className="cmds" variants={item}>
          <a className="btn btn-primary btn-lg" href="#install">
            Get started free <ArrowRight size={15} aria-hidden />
          </a>
          <a className="btn btn-outline btn-lg" href="#determinism">Why not an agent?</a>
        </motion.div>

        <motion.p className="hero-fine" variants={item}>
          No model in the execution path &middot; your code never leaves your machine &middot; MIT licensed
        </motion.p>

        <motion.div className="hero-demo" variants={item}>
          <Terminal />
        </motion.div>
      </motion.div>
    </section>
  );
}

function Credibility() {
  return (
    <section aria-label="Why this category exists" className="credibility">
      <div className="wrap cred-inner">
        <p className="cred-lead">
          Every large engineering organisation eventually builds this tool for itself.
        </p>
        <div className="cred-items">
          <span><strong>Google</strong> built Rosie</span>
          <span className="sep" aria-hidden />
          <span><strong>Meta</strong> built fastmod</span>
          <span className="sep" aria-hidden />
          <span><strong>Everyone else</strong> writes a shell script nobody trusts</span>
        </div>
      </div>
    </section>
  );
}

/* Step one of the argument: the trigger is fleet size, not code age. This is
 * the section that stops a greenfield team from dismissing the product. */
function Problem() {
  return (
    <section id="problem">
      <div className="wrap sec">
        <Reveal><span className="eyebrow">The problem</span></Reveal>
        <Reveal delay={0.05}>
          <h2 className="prose">The change takes ten minutes. Finishing it takes two years.</h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="lede prose">
            You deprecate an internal API. Then you find it is called in 400 places across
            60 repositories owned by 14 teams &mdash; none of whom report to you, and all of
            whom have something more urgent on the board.
          </p>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="figures">
            {([
              [400, "call sites to migrate"],
              [60, "repositories they live in"],
              [14, "teams who own those repos"],
            ] as const).map(([n, l]) => (
              <div className="figure" key={n}>
                <div className="n"><CountUp to={n} /></div>
                <div className="l">{l}</div>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.2}>
          <div className="prose stack">
            <p className="body">
              The cost was never the migration. It is that <strong>the old thing never
              dies</strong>: permanent maintenance, permanent test surface, and a permanent
              trap for whoever joins next.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.25}>
          <div className="triggers-block">
            <h3 className="triggers-title">
              This is not a legacy-code problem. The trigger is fleet size, not age.
            </h3>
            <p className="body prose">
              Breaking changes arrive from outside your codebase, on someone else&rsquo;s
              schedule. A six-week-old estate of sixty repositories has the same problem as
              a ten-year-old one.
            </p>
            <div className="triggers">
              {TRIGGERS.map(([title, body]) => (
                <div className="trigger" key={title}>
                  <h4>{title}</h4>
                  <p className="small">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* Step two: why the obvious 2026 answer - point an agent at each repo - does
 * not solve it. The differentiator, stated as the page's centrepiece. */
function Determinism() {
  return (
    <section id="determinism">
      <div className="wrap sec">
        <Reveal><span className="eyebrow">Determinism</span></Reveal>
        <Reveal delay={0.05}>
          <h2 className="prose">Sixty agent runs give you sixty diffs. Rollout gives you one.</h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="lede prose">
            A coding agent is excellent at deciding <em>what</em> the change should be. It is
            the wrong instrument for applying that decision identically sixty times, because
            it re-decides every time.
          </p>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="compare">
            <div className="compare-head">
              <span className="compare-label" />
              <span className="compare-col-head">An agent, run sixty times</span>
              <span className="compare-col-head is-ours">Rollout, run once</span>
            </div>
            {COMPARISON.map((row) => (
              <div className="compare-row" key={row.label}>
                <span className="compare-label">{row.label}</span>
                <span className="compare-cell">
                  <Minus size={13} className="mark-no" aria-hidden />
                  {row.agent}
                </span>
                <span className="compare-cell is-ours">
                  <Check size={13} className="mark-yes" aria-hidden />
                  {row.rollout}
                </span>
              </div>
            ))}
          </div>
        </Reveal>

        <Reveal delay={0.2}>
          <div className="callout">
            <p>
              <strong>They compose, and that is the point.</strong> Use an agent to write
              the transform &mdash; creative work, done once, against one example. Use
              rollout to distribute it deterministically. Where each call site genuinely
              needs different judgement, an agent is the right tool and rollout is not.
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* Step three: the mechanism, including the answer to "does this use AI?" */
function How() {
  return (
    <section id="how">
      <div className="wrap sec">
        <Reveal><span className="eyebrow">How it works</span></Reveal>
        <Reveal delay={0.05}>
          <h2 className="prose">Judgement happens once. Application happens everywhere.</h2>
        </Reveal>

        <Reveal delay={0.1}>
          <ol className="pipeline">
            {PIPELINE.map((p, i) => (
              <li className="pipe-stage" key={p.stage} data-ai={p.ai}>
                <div className="pipe-top">
                  <span className="pipe-index">{String(i + 1).padStart(2, "0")}</span>
                  <span className={`pipe-badge ${p.ai ? "is-ai" : "is-det"}`}>
                    {p.ai ? "judgement" : "deterministic"}
                  </span>
                </div>
                <h3>{p.stage}</h3>
                <div className="pipe-role">{p.role}</div>
                <p className="body">{p.body}</p>
              </li>
            ))}
          </ol>
        </Reveal>

        <div className="split">
          <Reveal delay={0.15}>
            <ConfigBlock code={CONFIG_SNIPPET} />
            <p className="small config-note">
              Transforms run in sequence, so anything keyed off the old name runs before the
              rename that removes it. Commands in <code>run</code> execute after them, inside
              each repository.
            </p>
          </Reveal>

          <Reveal delay={0.2}>
            <div className="ai-facts">
              <h3 className="ai-title">
                <ShieldCheck size={16} aria-hidden /> Does rollout use AI?
              </h3>
              <dl>
                {AI_FACTS.map(([title, body]) => (
                  <div className="ai-fact" key={title}>
                    <dt>{title}</dt>
                    <dd>{body}</dd>
                  </div>
                ))}
              </dl>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

/* Step four: what it can actually touch - the answer to "only code?" */
function Reach() {
  return (
    <section id="reach">
      <div className="wrap sec">
        <Reveal><span className="eyebrow">Reach</span></Reveal>
        <Reveal delay={0.05}>
          <h2 className="prose">Not only source files, and not only text edits.</h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="lede prose">
            Transforms operate on text, so shell scripts, Dockerfiles, CI workflows and
            config are reachable with a glob. And some migrations cannot be done by
            rewriting text at all &mdash; so commands run inside each repository too.
          </p>
        </Reveal>

        <Reveal delay={0.15}>
          <div className="callout callout-warn">
            <p>
              <strong>A dependency edit that does not regenerate its lockfile</strong> opens
              a pull request that fails CI in every repository at once. So{" "}
              <code>run: [["npm", "install", "--package-lock-only"]]</code> executes after
              the transform, and everything it touches is captured into the same diff. The
              same mechanism covers <code>go mod tidy</code>, a formatter&rsquo;s pass, a
              generated client, or a codemod binary you already trust.
            </p>
          </div>
        </Reveal>

        <Reveal delay={0.2}>
          <div className="capabilities">
            <div className="cap-head">
              <h3>Built-in transforms</h3>
              <p className="small">
                A transform is just <code>{"(file) => string | null"}</code>, so any parser
                or AST tool works inside one. These cover the ordinary cases.
              </p>
            </div>
            <div className="tablewrap">
              <table>
                <thead>
                  <tr>
                    <th scope="col">Helper</th>
                    <th scope="col">What it does</th>
                  </tr>
                </thead>
                <Stagger as="tbody" step={0.035}>
                  {HELPERS.map(([fn, desc]) => (
                    <motion.tr key={fn} variants={staggerItem}>
                      <td className="fn"><code>{fn}</code></td>
                      <td className="desc">{desc}</td>
                    </motion.tr>
                  ))}
                </Stagger>
              </table>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

/* Step five: qualify the reader in or out, honestly. */
function Fit() {
  return (
    <section id="fit">
      <div className="wrap sec">
        <Reveal><span className="eyebrow">Who it&rsquo;s for</span></Reveal>
        <Reveal delay={0.05}>
          <h2 className="prose">Rollout earns its place at about a dozen repositories.</h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="lede prose">
            It is built for the person who owns a library or a standard that other teams
            consume, and who is accountable for the migration actually landing.
          </p>
        </Reveal>

        <div className="fit">
          <Stagger className="fit-col" step={0.05}>
            <motion.h3 className="fit-head is-yes" variants={staggerItem}>
              <Check size={15} aria-hidden /> A good fit
            </motion.h3>
            {FIT_YES.map(([title, body]) => (
              <motion.div className="fit-item" key={title} variants={staggerItem}>
                <h4>{title}</h4>
                <p className="small">{body}</p>
              </motion.div>
            ))}
          </Stagger>

          <Stagger className="fit-col" step={0.05}>
            <motion.h3 className="fit-head is-no" variants={staggerItem}>
              <X size={15} aria-hidden /> Use something else
            </motion.h3>
            {FIT_NO.map(([title, body]) => (
              <motion.div className="fit-item" key={title} variants={staggerItem}>
                <h4>{title}</h4>
                <p className="small">{body}</p>
              </motion.div>
            ))}
          </Stagger>
        </div>
      </div>
    </section>
  );
}

function Security() {
  return (
    <section id="security">
      <div className="wrap sec">
        <Reveal><span className="eyebrow">Security</span></Reveal>
        <Reveal delay={0.05}>
          <h2 className="prose">
            A tool you do not trust on sixty repositories is a tool you will run on none.
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p className="lede prose">
            Rollout has no service behind it and no model in the path. There is nothing to
            send your code to, which removes most of the questions a security review asks.
          </p>
        </Reveal>

        <Stagger className="trust" step={0.05}>
          {TRUST.map(([title, body]) => (
            <motion.div className="trust-item" key={title} variants={staggerItem}>
              <span className="trust-icon"><ShieldCheck size={15} aria-hidden /></span>
              <div>
                <h3>{title}</h3>
                <p className="body">{body}</p>
              </div>
            </motion.div>
          ))}
        </Stagger>

        <Reveal delay={0.15}>
          <div className="guards-block">
            <h3 className="guards-title">
              <GitPullRequest size={15} aria-hidden /> What the defaults protect you from
            </h3>
            <Stagger as="dl" className="guards">
              {GUARDS.map(([term, detail]) => (
                <motion.div className="guard" key={term} variants={staggerItem}>
                  <dt>{term}</dt>
                  <dd>{detail}</dd>
                </motion.div>
              ))}
            </Stagger>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Pricing() {
  return (
    <section id="pricing">
      <div className="wrap sec">
        <Reveal><span className="eyebrow">Pricing</span></Reveal>
        <Reveal delay={0.05}><h2 className="prose">The tool is free. Always.</h2></Reveal>
        <Reveal delay={0.1}>
          <p className="lede prose">
            Paid tiers are for teams who want migrations shared across an organisation and
            tracked to completion. Nothing in the open-source tier is limited or time-boxed.
          </p>
        </Reveal>

        <Stagger className="plans" step={0.07}>
          {PLANS.map((plan) => (
            <motion.div className="plan" key={plan.name} data-featured={plan.featured} variants={staggerItem}>
              {plan.featured && <span className="plan-flag">In development</span>}
              <h3 className="plan-name">{plan.name}</h3>
              <div className="plan-price">{plan.price}</div>
              <div className="plan-note">{plan.note}</div>
              <ul className="plan-list">
                {plan.includes.map((f) => (
                  <li key={f}><Check size={14} aria-hidden /> {f}</li>
                ))}
              </ul>
              <a className={`btn ${plan.featured ? "btn-primary" : "btn-outline"} plan-cta`} href={plan.href}>
                {plan.cta}
              </a>
            </motion.div>
          ))}
        </Stagger>

        <Reveal delay={0.15}>
          <div id="install" className="install-strip">
            <div>
              <h3>Start in one command</h3>
              <p className="small">
                Node 20 or newer, git, and the GitHub CLI for opening pull requests.
              </p>
            </div>
            <CopyCommand command="npm i -g rollout-cli" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Faq() {
  return (
    <section id="faq">
      <div className="wrap sec">
        <Reveal><span className="eyebrow">Questions</span></Reveal>
        <Reveal delay={0.05}><h2 className="prose">Before you run it on sixty repositories.</h2></Reveal>
        <Stagger className="faq" step={0.05}>
          {FAQ.map(([q, a]) => (
            <motion.details className="faq-item" key={q} variants={staggerItem}>
              <summary>{q}</summary>
              <p className="body">{a}</p>
            </motion.details>
          ))}
        </Stagger>
      </div>
    </section>
  );
}

function CtaBand() {
  return (
    <section id="contact" className="cta-band">
      <div className="wrap cta-inner">
        <Reveal><h2>Stop carrying the deprecation you cannot finish.</h2></Reveal>
        <Reveal delay={0.06}>
          <p className="lede">
            Run <code>plan</code> against your repositories and see the whole migration as a
            single diff. It writes nothing, and needs nothing but read access.
          </p>
        </Reveal>
        <Reveal delay={0.12}>
          <div className="cmds cta-cmds">
            <a className="btn btn-primary btn-lg" href="#install">
              Get started free <ArrowRight size={15} aria-hidden />
            </a>
            <a className="btn btn-outline btn-lg" href="#determinism">Why not an agent?</a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Footer() {
  const columns: [string, [string, string][]][] = [
    ["Product", [["The problem", "#problem"], ["Determinism", "#determinism"], ["How it works", "#how"], ["Reach", "#reach"]]],
    ["Evaluate", [["Who it's for", "#fit"], ["Pricing", "#pricing"], ["FAQ", "#faq"]]],
    ["Trust", [["Security", "#security"], ["Safety defaults", "#security"], ["Licence: MIT", "#"]]],
    ["Company", [["Contact", "#contact"], ["GitHub", "#"]]],
  ];

  return (
    <footer>
      <div className="wrap footer-grid">
        <div className="footer-brand">
          <a className="wordmark" href="#top"><Glyph /> rollout</a>
          <p className="small">
            The same change, every repository, reviewed once. Deterministic migration
            across your whole estate.
          </p>
        </div>

        {columns.map(([heading, links]) => (
          <nav key={heading} aria-label={heading}>
            <h4>{heading}</h4>
            <ul>
              {links.map(([label, href]) => (
                <li key={label}><a href={href}>{label}</a></li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="wrap footer-base">
        <span>&copy; {new Date().getFullYear()} rollout</span>
        <span>MIT licensed</span>
        <span>Pre-release &mdash; the npm package is not published yet</span>
      </div>
    </footer>
  );
}
