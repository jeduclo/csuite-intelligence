// src/app/about/page.tsx
// About page — full-width marketing layout (no sidebar via ConditionalLayout).
// Sections:
//   1. Hero — founder positioning statement
//   2. The problem we solve
//   3. Philosophy — 5 non-negotiables
//   4. Tech stack — visual architecture
//   5. Who this is built for
//   6. Founder bio
//   7. Contact / booking CTA
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About | C-Suite Intelligence",
  description:
    "We build decision intelligence platforms that answer the questions your ERP never will — predictive, prescriptive, and macro-aware.",
};

const C = {
  blue:   "#1E6FE8",
  green:  "#3DA882",
  amber:  "#F59E0B",
  red:    "#C95555",
  purple: "#7B5EA7",
  muted:  "#A0B4CC",
  card:   "#1A3560",
  grid:   "#1E3A6E",
  bg:     "#0A1628",
  text:   "#C8D8F0",
};

// ─── Philosophy cards ──────────────────────────────────────────────────────
const PHILOSOPHY = [
  {
    number: "01",
    title:  "No vanity metrics.",
    desc:   "Every number shown must answer a decision question. If a metric doesn't drive action, it doesn't appear on the screen. Revenue charts without margin context are decoration.",
    colour: C.blue,
  },
  {
    number: "02",
    title:  "Prescriptive, not descriptive.",
    desc:   "Every dashboard page surfaces a recommended action — not just a number. 'DSCR is 1.18×' is a fact. 'Review capex before the lender meeting in 6 weeks' is intelligence.",
    colour: C.green,
  },
  {
    number: "03",
    title:  "Confidence shown, not hidden.",
    desc:   "We never show a single point forecast. P10/P50/P90 bands are always visible. Executives deserve to know the range of outcomes, not just the median.",
    colour: C.amber,
  },
  {
    number: "04",
    title:  "Your data never leaves your device.",
    desc:   "All analytical models run in the browser via ONNX Runtime Web and DuckDB-Wasm. No data is sent to a vendor cloud inference endpoint. No vendor or AI has access to your financials.",
    colour: C.purple,
  },
  {
    number: "05",
    title:  "Cost as a feature.",
    desc:   "The entire infrastructure stack — ADF, Data Lake, DuckDB, Azure SQL, DBT, Power BI Pro — runs at approximately $150 CAD per month. Enterprise analytics capability at a fraction of the price.",
    colour: C.red,
  },
];

// ─── Tech stack layers ─────────────────────────────────────────────────────
const STACK = [
  {
    layer:    "Data Sources",
    colour:   C.muted,
    items:    ["ERP / ERP exports", "Bank of Canada Valet API", "Statistics Canada WDS", "Yahoo Finance / TSX ETFs"],
  },
  {
    layer:    "Ingestion & Transform",
    colour:   C.blue,
    items:    ["Data Load Tool", "Azure Data Lake Gen2", "DBT Core (transformations)", "Zod schema validation"],
  },
  {
    layer:    "Analytics Engine",
    colour:   C.green,
    items:    ["DuckDB-Wasm (in-browser SQL)", "XGBoost → ONNX (forecasting)", "DoubleML → ONNX (causal inference)", "Chronos-Bolt → ONNX (time-series)"],
  },
  {
    layer:    "Application",
    colour:   C.amber,
    items:    ["Next.js 14 (App Router)", "TypeScript + Tailwind CSS", "Recharts / D3 (visualisation)", "ONNX Runtime Web (inference)", "PowerBI Pro"],
  },
  {
    layer:    "Deployment",
    colour:   C.purple,
    items:    ["Vercel (zero-config deploy)", "GitHub Actions (CI/CD)", "Custom domain + HTTPS", "No server-side inference"],
  },
];

// ─── Client fit criteria ───────────────────────────────────────────────────
const CLIENT_FIT = [
  { yes: true,  label: "$10K–$500M CAD revenue business"                                  },
  { yes: true,  label: "Has an ERP (SAP, Dynamics, NetSuite, Sage, QuickBooks Enterprise)" },
  { yes: true,  label: "CFO or CEO who wants answers, not more dashboards"                 },
  { yes: true,  label: "Tired of building cash forecasts in Excel"                         },
  { yes: true,  label: "Wants macro context (BoC, CPI, sector) tied to operational data"  },
  { yes: false, label: "Needs a BI tool to build their own reports"                        },
  { yes: false, label: "Already has Anaplan, Adaptive, or SAP Analytics"                  },
  { yes: false, label: "Wants a generic dashboard with vanity KPIs"                       },
];

// ─── Nav (same as home page) ───────────────────────────────────────────────
function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-navy-border bg-navy/95 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="group">
          <p className="text-white font-semibold text-sm group-hover:text-signal-blue transition-colors">
            C-Suite Intelligence
          </p>
          <p className="text-signal-muted text-xs">Decision Platform</p>
        </Link>
        <div className="flex items-center gap-6">
          <Link href="/cfo"   className="text-sm text-signal-muted hover:text-white transition-colors hidden sm:block">CFO Demo</Link>
          <Link href="/macro" className="text-sm text-signal-muted hover:text-white transition-colors hidden sm:block">Macro Demo</Link>
          <Link href="/about" className="text-sm text-white font-medium hidden sm:block">About</Link>
          <a
            href="https://calendly.com/jeanalegue/30min"
            target="_blank" rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: C.blue }}
          >
            Book a Call
          </a>
        </div>
      </div>
    </nav>
  );
}

// ─── Section title ─────────────────────────────────────────────────────────
function SectionLabel({ children, colour = C.blue }: { children: React.ReactNode; colour?: string }) {
  return (
    <p className="text-xs font-medium uppercase tracking-widest mb-3" style={{ color: colour }}>
      {children}
    </p>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────
export default function AboutPage() {
  return (
    <div className="min-h-screen bg-navy">
      <Nav />

      {/* ── Hero ────────────────────────────────────────────────────── */}
      <section className="pt-32 pb-20 px-6 max-w-6xl mx-auto">
        <div className="max-w-3xl">
          <SectionLabel>About C-Suite Intelligence</SectionLabel>
          <h1 className="text-4xl sm:text-5xl font-bold text-white leading-tight mb-6">
            Built because the answers{" "}
            <span style={{ color: C.muted }}>executives actually need</span>
            {" "}are not all found in an ERP.
          </h1>
          <p className="text-lg text-signal-muted leading-relaxed">
            C-Suite Intelligence is a decision intelligence solution built for CFOs, CEOs, and CROs
            of organisations that need to answer questions using data. We combine internal ERP data with external
            macro signals and three ML engines to deliver predictive and prescriptive
            intelligence — at a cost that makes enterprise analytics accessible to any
            organisation.
          </p>
        </div>
      </section>

      {/* ── The problem ──────────────────────────────────────────────── */}
      <section className="px-6 py-20 border-t border-navy-border">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div>
            <SectionLabel>The Problem</SectionLabel>
            <h2 className="text-3xl font-bold text-white mb-6">
              The data exists. The answers don't.
            </h2>
            <div className="space-y-5 text-signal-muted leading-relaxed">
              <p>
                Most organisations have an ERP. It captures transactions with remarkable
                fidelity — every invoice, every payment, every journal entry. And yet, when
                the CEO asks "what will our cash position be in 90 days?", the answer is
                a spreadsheet built last Friday.
              </p>
              <p>
                The problem isn't the data. It's that ERPs are designed to record the past,
                not inform the future. 
              </p>
              <p>
                Enterprise platforms like Anaplan and Adaptive Insights can. But they cost
                $200K–$500K per year and take 12–18 months to implement. That price point
                exists for a reason that has nothing to do with the underlying technology.
              </p>
              <p className="text-white font-medium">
                We built the same capability for approximately $150 CAD per month.
              </p>
            </div>
          </div>

          {/* Pull quote */}
          <div className="lg:pt-12">
            <div
              className="rounded-2xl p-8 border"
              style={{ borderColor: `${C.blue}30`, background: `${C.blue}08` }}
            >
              <p className="text-2xl font-semibold text-white leading-snug mb-6">
                "Your ERP tells you what happened. We tell you what's coming —
                and what to do about it."
              </p>
              <div className="border-t pt-5" style={{ borderColor: `${C.blue}20` }}>
                <p className="text-sm font-medium text-white">The platform answers:</p>
                <ul className="mt-3 space-y-2">
                  {[
                    "What will our cash be in 90 days?",
                    "Are we heading toward a covenant breach?",
                    "Which customers will default next?",
                    "What if we raise prices by 5%?",
                    "What does the BoC rate trajectory mean for our debt cost?",
                  ].map((q) => (
                    <li key={q} className="flex items-start gap-2 text-sm text-signal-muted">
                      <span style={{ color: C.blue }} className="mt-0.5 shrink-0">→</span>
                      {q}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Philosophy ───────────────────────────────────────────────── */}
      <section className="px-6 py-20 border-t border-navy-border">
        <div className="max-w-6xl mx-auto">
          <SectionLabel>Our Philosophy</SectionLabel>
          <h2 className="text-3xl font-bold text-white mb-3">
            Five things we will never compromise on.
          </h2>
          <p className="text-signal-muted mb-12 max-w-2xl">
            These are not aspirations. They are constraints that every design
            decision is tested against.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {PHILOSOPHY.map((p) => (
              <div
                key={p.number}
                className="rounded-xl p-6 border"
                style={{ borderColor: `${p.colour}25`, background: `${p.colour}06` }}
              >
                <p className="font-mono text-xs mb-4" style={{ color: p.colour }}>
                  {p.number}
                </p>
                <p className="font-semibold text-white mb-3">{p.title}</p>
                <p className="text-sm text-signal-muted leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Tech stack ───────────────────────────────────────────────── */}
      <section className="px-6 py-20 border-t border-navy-border">
        <div className="max-w-6xl mx-auto">
          <SectionLabel colour={C.green}>Architecture</SectionLabel>
          <h2 className="text-3xl font-bold text-white mb-3">
            A Medallion architecture at $150/month.
          </h2>
          <p className="text-signal-muted mb-12 max-w-2xl">
            Enterprise-grade data pipeline. All inference runs in the browser —
            no cloud GPU, no inference endpoint cost, no data egress.
          </p>

          {/* Stack layers — left to right flow on desktop, top to bottom on mobile */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {STACK.map((layer, i) => (
              <div key={layer.layer} className="relative">
                {/* Layer card */}
                <div
                  className="rounded-xl p-5 border h-full"
                  style={{ borderColor: `${layer.colour}30`, background: `${layer.colour}08` }}
                >
                  {/* Layer number + name */}
                  <p className="font-mono text-xs mb-1" style={{ color: layer.colour }}>
                    Layer {i + 1}
                  </p>
                  <p className="font-semibold text-white text-sm mb-4">{layer.layer}</p>
                  {/* Items */}
                  <ul className="space-y-2">
                    {layer.items.map((item) => (
                      <li key={item} className="flex items-start gap-2">
                        <span className="text-xs mt-0.5 shrink-0" style={{ color: layer.colour }}>·</span>
                        <span className="text-xs text-signal-muted leading-snug">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Arrow connector (desktop only, hidden on last item) */}
                {i < STACK.length - 1 && (
                  <div
                    className="hidden lg:flex absolute top-1/2 -right-3 -translate-y-1/2 z-10
                      w-6 h-6 items-center justify-center rounded-full text-xs"
                    style={{ background: C.grid, color: C.muted }}
                  >
                    →
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Three ML engines callout */}
          <div
            className="mt-8 rounded-2xl p-6 border grid grid-cols-1 sm:grid-cols-3 gap-6"
            style={{ borderColor: C.grid, background: C.card }}
          >
            <div className="sm:col-span-3 mb-2">
              <p className="text-white font-semibold">Three analytical engines — all running in-browser</p>
              <p className="text-signal-muted text-xs mt-1">
                Trained in Python, exported to ONNX, loaded via ONNX Runtime Web. Zero cloud inference cost.
              </p>
            </div>
            {[
              {
                name:    "XGBoost",
                purpose: "Structural predictor",
                use:     "Revenue/margin/cash P10/P50/P90 · Customer default probability (60-day)",
                colour:  C.blue,
              },
              {
                name:    "DoubleML PLR",
                purpose: "Causal inference engine",
                use:     "Treatment effect of price, marketing, headcount, rate changes · What-If Simulator",
                colour:  C.green,
              },
              {
                name:    "Chronos-Bolt",
                purpose: "Foundation forecaster",
                use:     "Zero-shot macro trend baseline · BoC rate trajectory · CPI/IPPI forward path",
                colour:  C.amber,
              },
            ].map((e) => (
              <div key={e.name}>
                <p className="font-mono text-sm font-medium mb-1" style={{ color: e.colour }}>
                  {e.name}
                </p>
                <p className="text-xs text-white mb-2">{e.purpose}</p>
                <p className="text-xs text-signal-muted leading-relaxed">{e.use}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Who this is for ──────────────────────────────────────────── */}
      <section className="px-6 py-20 border-t border-navy-border">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <SectionLabel>Client Fit</SectionLabel>
            <h2 className="text-3xl font-bold text-white mb-6">
              Built for a specific type of business.
            </h2>
            <p className="text-signal-muted leading-relaxed mb-8">
              This solution is for everyone. It is for C-suites who want more than spreadsheet forecasts, want answers before problems become
              visible in their ERP, and refuse to pay enterprise software prices
              for a problem that can be solved for a fraction of the cost.
            </p>

            <div className="space-y-2.5">
              {CLIENT_FIT.map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-xs shrink-0 font-bold"
                    style={{
                      background: item.yes ? `${C.green}20` : `${C.red}15`,
                      color:      item.yes ? C.green : C.red,
                    }}
                  >
                    {item.yes ? "✓" : "✗"}
                  </span>
                  <p className="text-sm" style={{ color: item.yes ? C.text : C.muted }}>
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing context */}
          <div className="lg:pt-10">
            <div
              className="rounded-2xl p-8 border"
              style={{ borderColor: C.grid, background: C.card }}
            >
              <p className="text-xs text-signal-muted uppercase tracking-wider mb-6">
                Cost comparison
              </p>
              <div className="space-y-5">
                {[
                  {
                    name:   "Anaplan / Adaptive Insights",
                    cost:   "$200K–$500K/yr",
                    colour: C.red,
                    note:   "12–18 month implementation · dedicated CS team required",
                  },
                  {
                    name:   "SAP Analytics Cloud",
                    cost:   "$150K–$300K/yr",
                    colour: C.amber,
                    note:   "Requires SAP ERP · heavy configuration",
                  },
                  {
                    name:   "Power BI Premium",
                    cost:   "$20K–$60K/yr",
                    colour: C.muted,
                    note:   "Descriptive only · no ML forecasting · no causal inference",
                  },
                  {
                    name:   "C-Suite Intelligence",
                    cost:   "~$150/mo",
                    colour: C.green,
                    note:   "Full stack · predictive + prescriptive · macro-aware · any ERP",
                    highlight: true,
                  },
                ].map((item) => (
                  <div
                    key={item.name}
                    className={`rounded-xl p-4 border ${item.highlight ? "border-signal-green/30" : ""}`}
                    style={{
                      borderColor: item.highlight ? `${C.green}30` : C.grid,
                      background:  item.highlight ? `${C.green}08` : "transparent",
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-sm font-medium text-white">{item.name}</p>
                      <p className="font-mono text-sm font-bold" style={{ color: item.colour }}>
                        {item.cost}
                      </p>
                    </div>
                    <p className="text-xs text-signal-muted">{item.note}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Founder ──────────────────────────────────────────────────── */}
      <section className="px-6 py-20 border-t border-navy-border">
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div>
            <SectionLabel>The Builder</SectionLabel>
            <h2 className="text-3xl font-bold text-white mb-6">
              Built by someone who has sat across from a CFO and heard "I wish I had known."
            </h2>
            <div className="space-y-5 text-signal-muted leading-relaxed">
              <p>
                C-Suite Intelligence was founded after years of watching 
                executives make high-stakes decisions like capital allocation decisions from Excel
                models and last-month's ERP reports — without the right tool for Risk Modeling & What-If Scenario analysis.
              </p>
              <p>
                The platform is built on a simple conviction: the data to answer
                every CFO's most important questions already exists inside their ERP.
                It just needs the right analytical layer, the right macro context,
                and the right models — delivered in a way that doesn't require a
                team of consultants to maintain.
              </p>
              <p>
                Every decision in the platform architecture — from in-browser ONNX
                inference to the $150/month infrastructure cost — reflects that conviction.
              </p>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="https://linkedin.com/in/jean-alegue"
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm border transition-all hover:border-signal-blue/50"
                style={{ borderColor: C.grid, color: C.muted }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
                LinkedIn
              </a>
              <a
                href="https://calendly.com/jeanalegue/30min"
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90"
                style={{ background: C.blue }}
              >
                Book a 30-min discovery call
              </a>
            </div>
          </div>

          {/* Credential strip */}
          <div className="space-y-4 lg:pt-4">
            {[
              {
                icon:   "🏗",
                title:  "Full-stack data architecture",
                desc:   "DLT · Azure Data Lake · DuckDB · DBT · Next.js · ONNX — end to end.",
                colour: C.blue,
              },
              {
                icon:   "🧠",
                title:  "Applied ML for finance",
                desc:   "XGBoost forecasting · DoubleML causal inference · Chronos time-series — trained in Python, deployed to browser.",
                colour: C.green,
              },
              {
                icon:   "📊",
                title:  "ERP + macro integration",
                desc:   "Bank of Canada Valet API · Statistics Canada WDS · Yahoo Finance — live macro context for operational decisions.",
                colour: C.amber,
              },
              {
                icon:   "🎯",
                title:  "C-suite communication",
                desc:   "Every output is designed to be understood in 60 seconds and acted on immediately — no data science degree required.",
                colour: C.purple,
              },
            ].map((item) => (
              <div
                key={item.title}
                className="rounded-xl p-5 border flex items-start gap-4"
                style={{ borderColor: `${item.colour}25`, background: `${item.colour}06` }}
              >
                <span className="text-xl mt-0.5">{item.icon}</span>
                <div>
                  <p className="font-semibold text-white text-sm mb-1">{item.title}</p>
                  <p className="text-xs text-signal-muted leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────── */}
      <section className="px-6 py-24 border-t border-navy-border text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-3xl font-bold text-white mb-4">
            Let's talk about your data.
          </h2>
          <p className="text-signal-muted mb-10 leading-relaxed">
            We start with a 30-minute call — no slides, no pitch deck. We
            learn about your ERP, your reporting pain points, and what decisions
            you wish you could make faster. If there's a fit, we show you exactly
            what the platform would look like on your data.
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
              className="px-8 py-4 rounded-xl text-base font-semibold border transition-all hover:border-signal-blue/50"
              style={{ borderColor: C.grid, color: C.muted }}
            >
              Explore the CFO Demo
            </Link>
          </div>
          <p className="text-xs text-signal-muted mt-8">
            Or reach out directly at{" "}
            <a
              href="mailto:jean@csuiteintelligence.ca"
              className="hover:text-white transition-colors"
              style={{ color: C.blue }}
            >
              jean@csuiteintelligence.ca
            </a>
          </p>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <footer className="px-6 py-10 border-t border-navy-border">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <Link href="/" className="text-white font-semibold text-sm hover:text-signal-blue transition-colors">
              C-Suite Intelligence
            </Link>
            <p className="text-signal-muted text-xs mt-0.5">
              © {new Date().getFullYear()} · csuiteintelligence.ca
            </p>
          </div>
          <div className="flex gap-6 text-xs text-signal-muted">
            <Link href="/"      className="hover:text-white transition-colors">Home</Link>
            <Link href="/cfo"   className="hover:text-white transition-colors">CFO Demo</Link>
            <Link href="/macro" className="hover:text-white transition-colors">Macro Demo</Link>
            <Link href="/about" className="hover:text-white transition-colors">About</Link>
            <a
              href="https://calendly.com/jeanalegue/30min"
              target="_blank" rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              Book a Call
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}