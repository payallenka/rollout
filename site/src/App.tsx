import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight, CalendarCheck, Check, Clock, GitPullRequest,
  Lock, Terminal as TerminalIcon, Users, type LucideIcon,
} from "lucide-react";
import { Terminal, ConfigBlock } from "./components/Terminal";
import {
  CopyCommand, CountUp, Glyph, Reveal, ScrollProgress, Stagger,
  staggerItem, useActiveSection, useHeroParallax, useStuck,
} from "./components/ui";
import {
  CONFIG_SNIPPET, FAQ, GUARDS, HELPERS, PLANS, STEPS, TRUST,
  USE_CASES, VALUE_PROPS,
} from "./data";

const NAV = [
  ["Why rollout", "#why"],
  ["Product", "#product"],
  ["Security", "#security"],
  ["Pricing", "#pricing"],
  ["FAQ", "#faq"],
] as const;

const ICONS: Record<string, LucideIcon> = {
  calendar: CalendarCheck,
  clock: Clock,
  terminal: TerminalIcon,
  users: Users,
};

export default function App() {
  return (
    <>
      <ScrollProgress />
      <a className="skip" href="#main">Skip to content</a>
      <TopBar />
      <main id="main">
        <Hero />
        <Credibility />
        <Why />
        <Product />
        <UseCases />
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
          <a className="btn btn-primary" href="#pricing">
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
          Code migration at organisation scale
        </motion.span>

        <motion.h1 variants={item}>
          Ship the breaking change. <em>Across every repository.</em> This week.
        </motion.h1>

        <motion.p className="hero-sub" variants={item}>
          Rollout turns an org-wide migration into one transform and a pull request per
          repository. The deprecation you have been carrying for two years ships on the
          date you set.
        </motion.p>

        <motion.div className="cmds" variants={item}>
          <a className="btn btn-primary btn-lg" href="#pricing">
            Get started free <ArrowRight size={15} aria-hidden />
          </a>
          <a className="btn btn-outline btn-lg" href="#contact">Talk to us</a>
        </motion.div>

        <motion.p className="hero-fine" variants={item}>
          Free and open source &middot; your code never leaves your machine &middot; no account required
        </motion.p>

        <motion.div className="hero-demo" variants={item}>
          <Terminal />
        </motion.div>
      </motion.div>
    </section>
  );
}

/* Instead of borrowed customer logos, the honest form of social proof: the
 * companies that already solved this internally, at great expense. */
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

function Why() {
  return (
    <section id="why">
      <div className="wrap sec">
        <Reveal><span className="eyebrow">Why rollout</span></Reveal>
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

        <Stagger className="props props-4" step={0.07}>
          {VALUE_PROPS.map((p) => {
            const Icon = ICONS[p.icon];
            return (
              <motion.div className="prop" key={p.title} variants={staggerItem}>
                <span className="prop-icon"><Icon size={18} aria-hidden /></span>
                <h3>{p.title}</h3>
                <p className="body">{p.body}</p>
              </motion.div>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}

function Product() {
  return (
    <section id="product">
      <div className="wrap sec">
        <Reveal><span className="eyebrow">How it works</span></Reveal>
        <Reveal delay={0.05}>
          <h2 className="prose">Write the change once. Review every diff. Ship the pull requests.</h2>
        </Reveal>

        <div className="split">
          <Stagger className="steps" step={0.09}>
            {STEPS.map((s) => (
              <motion.div className="step" key={s.n} variants={staggerItem}>
                <div className="num">{s.n}</div>
                <div>
                  <h3>{s.title}</h3>
                  <p className="body">{s.body}</p>
                </div>
              </motion.div>
            ))}
          </Stagger>

          <Reveal delay={0.1}>
            <ConfigBlock code={CONFIG_SNIPPET} />
            <p className="small config-note">
              Transforms run in sequence, so anything keyed off the old name runs before the
              rename that removes it.
            </p>
          </Reveal>
        </div>

        <Reveal delay={0.15}>
          <div className="capabilities">
            <div className="cap-head">
              <h3>Built-in transforms</h3>
              <p className="small">
                A transform is just <code>{"(file) => string | null"}</code>, so any parser or
                AST tool works inside one. These cover the ordinary cases.
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

function UseCases() {
  return (
    <section id="use-cases">
      <div className="wrap sec">
        <Reveal><span className="eyebrow">Use cases</span></Reveal>
        <Reveal delay={0.05}>
          <h2 className="prose">One change, everywhere it needs to go.</h2>
        </Reveal>
        <Stagger className="cases" step={0.05}>
          {USE_CASES.map(([title, body]) => (
            <motion.div className="case" key={title} variants={staggerItem}>
              <h3>{title}</h3>
              <p className="body">{body}</p>
            </motion.div>
          ))}
        </Stagger>
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
            Rollout has no service behind it. There is nothing to send your code to, which
            removes most of the questions a security review would otherwise ask.
          </p>
        </Reveal>

        <Stagger className="trust" step={0.05}>
          {TRUST.map(([title, body]) => (
            <motion.div className="trust-item" key={title} variants={staggerItem}>
              <span className="trust-icon"><Lock size={15} aria-hidden /></span>
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
            <motion.div
              className="plan"
              key={plan.name}
              data-featured={plan.featured}
              variants={staggerItem}
            >
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
            diff. It writes nothing, and needs nothing but read access.
          </p>
        </Reveal>
        <Reveal delay={0.12}>
          <div className="cmds cta-cmds">
            <a className="btn btn-primary btn-lg" href="#pricing">
              Get started free <ArrowRight size={15} aria-hidden />
            </a>
            <a className="btn btn-outline btn-lg" href="#install">Read the docs</a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

function Footer() {
  const columns: [string, [string, string][]][] = [
    ["Product", [["Why rollout", "#why"], ["How it works", "#product"], ["Use cases", "#use-cases"], ["Pricing", "#pricing"]]],
    ["Resources", [["Documentation", "#install"], ["Transforms", "#product"], ["FAQ", "#faq"]]],
    ["Trust", [["Security", "#security"], ["Safety defaults", "#security"], ["Licence: MIT", "#"]]],
    ["Company", [["Contact", "#contact"], ["GitHub", "#"]]],
  ];

  return (
    <footer>
      <div className="wrap footer-grid">
        <div className="footer-brand">
          <a className="wordmark" href="#top"><Glyph /> rollout</a>
          <p className="small">
            Make a breaking change once. Get pull requests open on every repository that
            needs it.
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
