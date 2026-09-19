// src/app/page.tsx
// Marketing home page — replaces the redirect.
// Matches csuiteintelligence.ca positioning and branding.
// No sidebar — full-width marketing layout.
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "C-Suite Intelligence | What Your ERP Cannot Tell You",
};

// ─── Signal colours (inline — no Tailwind needed for SVG elements) ─────────
const C = {
  blue:  "#1E6FE8",
  green: "#3DA882",
  amber: "#F59E0B",
  red:   "#C95555",
  muted: "#A0B4CC",
  card:  "#1A3560",
  grid:  "#1E3A6E",
  purple: "#7C3AED",
};

// ─── Live signal ticker data (matches the actual dashboard values) ─────────
const SIGNALS = [
  { label: "Cash Position — Week 13", value: "$6.97M",  signal: "amber", delta: "−$420K vs last week" },
  { label: "DSCR vs Covenant Floor",  value: "1.18×",   signal: "red",   delta: "Floor: 1.25×"        },
  { label: "Revenue Forecast P50",    value: "$4.2M",   signal: "green", delta: "+3.1% vs prior Q"    },
  { label: "60-Day Default Risk",     value: "3 accts", signal: "red",   delta: "$1.55M at risk"      },
  { label: "Macro Cycle Phase",       value: "Mid-Cycle",signal:"blue",  delta: "BoC @ 2.25%"         },
];

// ─── Gap section data ──────────────────────────────────────────────────────
const GAPS = [
  {
    question: "What will our cash position be in 90 days?",
    erp:      "A static roll-forward built in Excel — already stale.",
    platform: "Probabilistic P10/P50/P90 forecast, updated weekly from your AP/AR data.",
  },
  {
    question: "Are we heading toward a covenant breach?",
    erp:      "DSCR from last month's close. No trend. No alert.",
    platform: "Live DSCR trend vs your covenant floor, stress-tested at +100 and +200bps.",
  },
  {
    question: "Which customers will default before they miss a payment?",
    erp:      "An AR aging report. Useful only after the damage is done.",
    platform: "XGBoost 60-day default probability with SHAP-explained drivers per customer.",
  },
  {
    question: "Which TSX sectors should we rotate into right now?",
    erp:      "Nothing. Your ERP has no macro awareness whatsoever.",
    platform: "BoC rate trajectory, yield curve, CPI/IPPI, and TSX sector rotation — translated into a capital allocation posture.",
  },
];

// ─── Platform pillars ──────────────────────────────────────────────────────
const PILLARS = [
  { icon: "📍", title: "Know where you stand",    desc: "Near real-time financial health across cash, margin, covenant, and credit risk — in one view."            },
  { icon: "🔭", title: "See what's coming",        desc: "Chronos and XGBoost models give you probabilistic forecasts, not point estimates."                   },
  { icon: "🎯", title: "Know what to do",          desc: "Every dashboard surfaces a recommended action — not just a number."                                  },
  { icon: "🌐", title: "Macro-aware",              desc: "BoC rates, yield curve, StatCan data, and TSX sector rotation baked in — updated weekly."            },
];

// ─── Signal badge ──────────────────────────────────────────────────────────
function SignalDot({ signal }: { signal: string }) {
  const colour =
    signal === "green" ? C.green :
    signal === "red"   ? C.red   :
    signal === "amber" ? C.amber : C.blue;
  return (
    <span
      className="inline-block w-2 h-2 rounded-full"
      style={{ background: colour, boxShadow: `0 0 6px ${colour}80` }}
    />
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────
function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-navy-border bg-navy/95 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <div>
          <p className="text-white font-semibold text-sm">C-Suite Intelligence</p>
          <p className="text-signal-muted text-xs">Decision Platform</p>
        </div>
        <div className="flex items-center gap-6">
          <Link href="/cfo"   className="text-sm text-signal-muted hover:text-white transition-colors hidden sm:block">
            CFO Demo
          </Link>
          <Link href="/macro" className="text-sm text-signal-muted hover:text-white transition-colors hidden sm:block">
            Macro Demo
          </Link>
          <Link href="/about" className="text-sm text-signal-muted hover:text-white transition-colors hidden sm:block">
            About
          </Link>
          <a
            href="https://calendly.com/jeanalegue/30min"
            target="_blank" rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-all"
            style={{ background: C.blue }}
          >
            Book a Call
          </a>
        </div>
      </div>
    </nav>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <div className="min-h-screen bg-navy">
      <Nav />

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="pt-32 pb-20 px-6 max-w-6xl mx-auto">
        <div className="max-w-3xl">
          {/* Eyebrow */}
          <p className="text-xs font-medium uppercase tracking-widest mb-6"
            style={{ color: C.blue }}>
            Decision Intelligence for the C-Suite
          </p>

          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6">
            Your ERP tells you{" "}
            <span style={{ color: C.muted }}>what happened.</span>
            <br />
            We tell you{" "}
            <span style={{ color: C.blue }}>what's coming</span>
            {" "}—{" "}
            <span style={{ color: C.green }}>and what to do about it.</span>
          </h1>

          {/* Sub */}
          <p className="text-lg text-signal-muted leading-relaxed mb-10 max-w-2xl">
            We connect your internal ERP data with external macro signals and
            predictive models to give your CFO, CEO and CRO the answers they
            need for informed decisions — in under 60 seconds. We do not expose
            your data to AI.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4">
            <Link
              href="/cfo"
              className="px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{ background: C.blue }}
            >
              See the CFO Demo →
            </Link>
            <a
              href="https://calendly.com/jeanalegue/30min"
              target="_blank" rel="noopener noreferrer"
              className="px-6 py-3 rounded-xl text-sm font-semibold border transition-all hover:border-signal-blue/60"
              style={{ borderColor: C.grid, color: C.muted }}
            >
              Book a Discovery Call
            </a>
          </div>
        </div>
      </section>

      {/* ── Live signal ticker ───────────────────────────────────────── */}
      <section className="px-6 pb-20 max-w-6xl mx-auto">
        <p className="text-xs text-signal-muted uppercase tracking-widest mb-4">
          Platform signals — live from the CFO dashboard
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {SIGNALS.map((s) => {
            const colour =
              s.signal === "green" ? C.green :
              s.signal === "red"   ? C.red   :
              s.signal === "amber" ? C.amber : C.blue;
            return (
              <Link
                key={s.label}
                href="/cfo"
                className="rounded-xl p-4 border transition-all hover:border-opacity-60"
                style={{
                  background:   `${colour}08`,
                  borderColor:  `${colour}30`,
                  borderWidth:  "1px",
                  borderStyle:  "solid",
                  borderLeft:   `3px solid ${colour}`,
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <SignalDot signal={s.signal} />
                  <p className="text-xs text-signal-muted leading-tight">{s.label}</p>
                </div>
                <p className="font-mono font-semibold text-lg" style={{ color: colour }}>
                  {s.value}
                </p>
                <p className="text-xs mt-1" style={{ color: `${colour}CC` }}>
                  {s.delta}
                </p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* ── The Gap ─────────────────────────────────────────────────── */}
      <section className="px-6 py-20 border-t border-navy-border">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: C.blue }}>
            The Gap
          </p>
          <h2 className="text-3xl font-bold text-white mb-3">
            Most of the answers for decision making aren't in standard ERP software.
          </h2>
          <p className="text-signal-muted mb-12 max-w-2xl">
            Our solution can help answer questions that your standard ERP does not.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {GAPS.map((g) => (
              <div key={g.question}
                className="rounded-xl p-6 border"
                style={{ borderColor: C.grid, background: C.card }}>
                {/* Question */}
                <p className="font-semibold text-white mb-5">"{g.question}"</p>

                <div className="grid grid-cols-2 gap-4">
                  {/* ERP today */}
                  <div className="rounded-lg p-3" style={{ background: `${C.red}10`, border: `1px solid ${C.red}20` }}>
                    <p className="text-xs font-medium mb-2" style={{ color: C.red }}>
                      Your ERP today
                    </p>
                    <p className="text-xs text-signal-muted leading-relaxed">{g.erp}</p>
                  </div>
                  {/* With platform */}
                  <div className="rounded-lg p-3" style={{ background: `${C.green}10`, border: `1px solid ${C.green}20` }}>
                    <p className="text-xs font-medium mb-2" style={{ color: C.green }}>
                      With our platform
                    </p>
                    <p className="text-xs text-signal-muted leading-relaxed">{g.platform}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4 Pillars ───────────────────────────────────────────────── */}
      <section className="px-6 py-20 border-t border-navy-border">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: C.blue }}>
            Our Approach
          </p>
          <h2 className="text-3xl font-bold text-white mb-12">
            Platform-agnostic. Built to minimise cost.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PILLARS.map((p) => (
              <div key={p.title}
                className="rounded-xl p-6 border"
                style={{ borderColor: C.grid, background: C.card }}>
                <p className="text-2xl mb-4">{p.icon}</p>
                <p className="font-semibold text-white mb-2">{p.title}</p>
                <p className="text-sm text-signal-muted leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Demo showcase ────────────────────────────────────────────── */}
      <section className="px-6 py-20 border-t border-navy-border">
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: C.blue }}>
            Live Demos
          </p>
          <h2 className="text-3xl font-bold text-white mb-3">
            See it running on real data.
          </h2>
          <p className="text-signal-muted mb-12 max-w-2xl">
            Every number is computed from simulated ERP
            transactions, real macro API feeds, and ML models running in-browser.
          </p>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* CFO demo */}
            <div className="rounded-xl p-8 border" style={{ borderColor: C.grid, background: C.card }}>
              <div className="flex items-center justify-between mb-6">
                <p className="text-xs font-medium px-2 py-1 rounded-full"
                  style={{ background: `${C.green}20`, color: C.green, border: `1px solid ${C.green}30` }}>
                  Available Now
                </p>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">CFO Intelligence App</h3>
              <p className="text-signal-muted text-sm mb-6 leading-relaxed">
                6 pages. 12 sample questions our solution helps you answer. Cash forecasting,
                covenant tracking, customer default scoring, what-if simulation —
                all in one dashboard.
              </p>
              <ul className="space-y-2 mb-8">
                {[
                  "13-week probabilistic cash forecast",
                  "DSCR trend vs covenant floor",
                  "60-day customer default probability",
                  "Causal what-if simulator",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-signal-muted">
                    <span style={{ color: C.green }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/cfo"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ background: C.blue }}
              >
                Launch CFO Demo →
              </Link>
            </div>

            {/* Macro demo */}
            <div className="rounded-xl p-8 border" style={{ borderColor: C.grid, background: C.card }}>
              <div className="flex items-center justify-between mb-6">
                <p className="text-xs font-medium px-2 py-1 rounded-full"
                  style={{ background: `${C.green}20`, color: C.green, border: `1px solid ${C.green}30` }}>
                  Available Now
                </p>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Macro Intelligence Dashboard</h3>
              <p className="text-signal-muted text-sm mb-6 leading-relaxed">
                6 modules. BoC policy trajectory, yield curve analysis, CPI vs
                IPPI margin squeeze, TSX sector rotation — translated into a
                capital allocation posture your board can act on.
              </p>
              <ul className="space-y-2 mb-8">
                {[
                  "Bank of Canada rate trajectory",
                  "Yield curve recession signal",
                  "Cyclical vs defensive rotation",
                  "Macro cycle phase classification",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-signal-muted">
                    <span style={{ color: C.green }}>✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link
                href="/macro"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold border transition-all"
                style={{ borderColor: C.grid, color: C.muted }}
              >
                Launch Macro Demo →
              </Link>
            </div>
          </div>
        </div>
      </section>

            {/* ── Causal Inference / What-If ───────────────────────────────── */}
      <section className="px-6 py-20 border-t border-navy-border">
        <div className="max-w-6xl mx-auto">

          {/* Header */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-xs font-medium uppercase tracking-widest mb-3"
                style={{ color: C.blue }}>
                Prescriptive Intelligence
              </p>
              <h2 className="text-3xl font-bold text-white mb-5">
                Don't just forecast.{" "}
                <span style={{ color: C.green }}>Model the intervention.</span>
              </h2>
              <p className="text-signal-muted leading-relaxed mb-6">
                Most platforms tell you where you'll end up. Ours tells you
                what happens if you pull a lever — and by exactly how much.
              </p>
              <p className="text-signal-muted leading-relaxed mb-8">
                Our What-If Simulator is powered by{" "}
                <span className="text-white font-medium">DoubleML</span>
                {" "}— a causal inference framework that estimates the true
                treatment effect of each intervention, controlling for
                confounders like macro conditions, seasonality, and customer
                concentration. Unlike a sensitivity table, these are{" "}
                <span className="text-white font-medium">causal estimates</span>
                , not correlations.
              </p>
              <Link
                href="/cfo/simulator"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-all hover:opacity-90"
                style={{ background: C.blue }}
              >
                Open the Simulator →
              </Link>
            </div>

            {/* Lever showcase */}
            <div className="space-y-4">
              {[
                {
                  lever:   "Price +5%",
                  outcome: "+4.85% revenue · +1.8pp gross margin",
                  note:    "Price elasticity −0.55 · some volume erosion offset",
                  colour:  C.blue,
                  icon:    "💰",
                },
                {
                  lever:   "Marketing spend +30%",
                  outcome: "+2.1% revenue · −2.7pp gross margin",
                  note:    "Diminishing returns above +10% · COGS offset",
                  colour:  C.purple,
                  icon:    "📣",
                },
                {
                  lever:   "Headcount −10%",
                  outcome: "−2.1% revenue · +1.4pp gross margin",
                  note:    "Capability loss modelled · SG&A savings offset",
                  colour:  C.amber,
                  icon:    "👥",
                },
                {
                  lever:   "BoC rate +200bps",
                  outcome: "+$76K/quarter debt service · −$0.30M cash",
                  note:    "Applied to floating-rate facilities only",
                  colour:  C.red,
                  icon:    "🏦",
                },
              ].map((item) => (
                <div
                  key={item.lever}
                  className="rounded-xl p-4 border flex items-start gap-4"
                  style={{
                    borderColor: `${item.colour}25`,
                    background:  `${item.colour}08`,
                  }}
                >
                  <span className="text-xl mt-0.5">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <p className="font-semibold text-sm text-white">{item.lever}</p>
                      <p className="font-mono text-xs font-medium"
                        style={{ color: item.colour }}>
                        {item.outcome}
                      </p>
                    </div>
                    <p className="text-xs text-signal-muted mt-1">{item.note}</p>
                  </div>
                </div>
              ))}

              {/* DoubleML badge */}
              <div className="rounded-xl p-4 border flex items-center gap-3 mt-2"
                style={{ borderColor: C.grid, background: C.card }}>
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: `${C.blue}20` }}>
                  <span className="text-sm">⚗️</span>
                </div>
                <div>
                  <p className="text-xs font-medium text-white">
                    Powered by DoubleML — Partially Linear Regression
                  </p>
                  <p className="text-xs text-signal-muted mt-0.5">
                    Causal treatment effect estimation · confounders controlled ·
                    ONNX inference runs in-browser — your data never leaves your device
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Scenario comparison strip */}
          <div className="mt-14 rounded-2xl border overflow-hidden"
            style={{ borderColor: C.grid }}>
            {/* Header row */}
            <div className="grid grid-cols-4 text-xs font-medium uppercase tracking-wider px-6 py-3 border-b"
              style={{ borderColor: C.grid, background: C.card }}>
              <span className="text-signal-muted">Metric</span>
              <span className="text-signal-muted text-center">Baseline</span>
              <span className="text-center" style={{ color: C.blue }}>Price +5% Scenario</span>
              <span className="text-center" style={{ color: C.red }}>Rate +200bps Stress</span>
            </div>
            {[
              { label: "Quarterly Revenue",  base: "$4.22M", scen: "$4.43M", stress: "$4.22M" },
              { label: "Gross Margin",       base: "34.2%",  scen: "36.0%",  stress: "34.2%"  },
              { label: "EBITDA",             base: "$1.18M", scen: "$1.46M", stress: "$1.06M" },
              { label: "Debt Service / Qtr", base: "$380K",  scen: "$380K",  stress: "$456K"  },
              { label: "DSCR",               base: "0.78×",  scen: "0.96×",  stress: "0.58×"  },
            ].map((row, i) => (
              <div
                key={row.label}
                className="grid grid-cols-4 px-6 py-3 border-b text-sm"
                style={{
                  borderColor: C.grid,
                  background: i % 2 === 0 ? "transparent" : `${C.card}80`,
                }}
              >
                <span className="text-signal-muted">{row.label}</span>
                <span className="font-mono text-white text-center">{row.base}</span>
                <span className="font-mono text-center font-medium" style={{ color: C.green }}>
                  {row.scen}
                </span>
                <span className="font-mono text-center" style={{ color: C.red }}>
                  {row.stress}
                </span>
              </div>
            ))}
            {/* Footer CTA */}
            <div className="px-6 py-4 flex items-center justify-between"
              style={{ background: C.card }}>
              <p className="text-xs text-signal-muted">
                All outputs update instantly as you move the sliders — no backend, no wait.
              </p>
              <Link
                href="/cfo/simulator"
                className="text-xs font-medium hover:opacity-80 transition-opacity"
                style={{ color: C.blue }}
              >
                Try it live →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── ROI ─────────────────────────────────────────────────────── */}
      <section className="px-6 py-20 border-t border-navy-border">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-12 text-center">
            The ROI case writes itself.
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
            {[
              { value: "~$150",        unit: "CAD/month",   desc: "Optimized Cloud & Edge-Compute Data Architecture — DLT, Azure Data Lake, DuckDB, Azure SQL, DBT, Power BI Pro, Next.Js" },
              { value: "$200K–$500K",  unit: "per year",    desc: "What comparable platforms charge — Anaplan, Adaptive, SAP Analytics — for the same capability" },
              { value: "60 sec",       unit: "or less",     desc: "Time for a CFO to answer any Strategic Forecasting & Decision Optimization question, run Risk Modeling & What-If Scenarios" },
            ].map((r) => (
              <div key={r.value}>
                <p className="font-mono text-4xl font-bold text-white mb-1">{r.value}</p>
                <p className="text-sm font-medium mb-3" style={{ color: C.blue }}>{r.unit}</p>
                <p className="text-sm text-signal-muted leading-relaxed">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ────────────────────────────────────────────────── */}
      <section className="px-6 py-24 border-t border-navy-border text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to see what your data can tell you?
          </h2>
          <p className="text-signal-muted mb-10">
            We start with a 30-minute discovery call. No slides. We learn about
            your data and provide a cost-effective architecture that meets your needs.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <a
              href="https://calendly.com/jeanalegue/30min"
              target="_blank" rel="noopener noreferrer"
              className="px-8 py-4 rounded-xl text-base font-semibold text-white transition-all hover:opacity-90"
              style={{ background: C.blue }}
            >
              Book a Discovery Call
            </a>
            <Link
              href="/cfo"
              className="px-8 py-4 rounded-xl text-base font-semibold border transition-all"
              style={{ borderColor: C.grid, color: C.muted }}
            >
              Explore the Demo
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="px-6 py-10 border-t border-navy-border">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-white font-semibold text-sm">C-Suite Intelligence</p>
            <p className="text-signal-muted text-xs mt-0.5">
              © {new Date().getFullYear()} · csuiteintelligence.ca
            </p>
          </div>
          <div className="flex gap-6 text-xs text-signal-muted">
            <Link href="/cfo"   className="hover:text-white transition-colors">CFO Demo</Link>
            <Link href="/macro" className="hover:text-white transition-colors">Macro Demo</Link>
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
            <a href="https://calendly.com/jeanalegue/30min"
              target="_blank" rel="noopener noreferrer"
              className="hover:text-white transition-colors">
              Book a Call
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}