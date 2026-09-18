// src/app/cfo/cash/page.tsx
//
// Answers two questions:
//   1. What will our cash position be in 90 days?
//   2. What is our worst case if our top customer pays 30 days late?
//
// Charts:
//   - P10/P50/P90 fan chart (13-week history + 12-week forecast)
//   - Weekly AP vs AR waterfall (grouped bar)
//   - Running net cash flow (area chart)
//
// Interactivity:
//   - 4 scenario toggle buttons shift the forecast bands in real-time
//   - KPI cards and InsightBanner update dynamically with the scenario
"use client";

import { useState } from "react";
import {
  ComposedChart,
  AreaChart,
  Area,
  Line,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { KPICard }        from "@/components/ui/KPICard";
import { InsightBanner }  from "@/components/ui/InsightBanner";

// ─────────────────────────────────────────────────────────────────────────────
// COLOURS — match Tailwind theme tokens exactly
// ─────────────────────────────────────────────────────────────────────────────
const C = {
  blue:   "#1E6FE8",
  green:  "#3DA882",
  amber:  "#F59E0B",
  red:    "#C95555",
  purple: "#7B5EA7",
  muted:  "#A0B4CC",
  grid:   "#1E3A6E",
  card:   "#1A3560",
  bg:     "#0A1628",
  text:   "#C8D8F0",
};

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO DEFINITIONS
// Each scenario applies a delta to P10/P50/P90 in the forecast weeks.
// Combined = additive of both individual shocks.
// ─────────────────────────────────────────────────────────────────────────────
type ScenarioKey = "base" | "customer_late" | "rate_shock" | "combined";

const SCENARIOS: Record<
  ScenarioKey,
  { label: string; sublabel: string; delta: number; signal: "green" | "amber" | "red" }
> = {
  base: {
    label:    "Base Case",
    sublabel: "No stress applied",
    delta:    0,
    signal:   "green",
  },
  customer_late: {
    label:    "Top Customer 30d Late",
    sublabel: "C-0012 delays $820K",
    delta:    -0.82,
    signal:   "amber",
  },
  rate_shock: {
    label:    "BoC Rate +200bps",
    sublabel: "Debt service increases",
    delta:    -0.38,
    signal:   "amber",
  },
  combined: {
    label:    "Combined Stress",
    sublabel: "Both shocks simultaneously",
    delta:    -1.20,
    signal:   "red",
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// DATA
// Weeks W1–W13  = historical actual cash position
// Weeks W14–W25 = XGBoost forecast (P10 / P50 / P90)
// ar / ap       = weekly AP payments and AR receipts in $K
// ─────────────────────────────────────────────────────────────────────────────
const BASE_DATA = [
  { week: "W1",  actual: 7.82, p10: null, p50: null, p90: null, ar: 820,  ap: 610,  isForecast: false },
  { week: "W2",  actual: 7.65, p10: null, p50: null, p90: null, ar: 750,  ap: 580,  isForecast: false },
  { week: "W3",  actual: 7.41, p10: null, p50: null, p90: null, ar: 690,  ap: 720,  isForecast: false },
  { week: "W4",  actual: 7.90, p10: null, p50: null, p90: null, ar: 950,  ap: 480,  isForecast: false },
  { week: "W5",  actual: 7.55, p10: null, p50: null, p90: null, ar: 710,  ap: 640,  isForecast: false },
  { week: "W6",  actual: 7.30, p10: null, p50: null, p90: null, ar: 680,  ap: 730,  isForecast: false },
  { week: "W7",  actual: 7.12, p10: null, p50: null, p90: null, ar: 620,  ap: 810,  isForecast: false },
  { week: "W8",  actual: 7.44, p10: null, p50: null, p90: null, ar: 890,  ap: 560,  isForecast: false },
  { week: "W9",  actual: 7.28, p10: null, p50: null, p90: null, ar: 730,  ap: 700,  isForecast: false },
  { week: "W10", actual: 7.05, p10: null, p50: null, p90: null, ar: 650,  ap: 780,  isForecast: false },
  { week: "W11", actual: 6.88, p10: null, p50: null, p90: null, ar: 600,  ap: 820,  isForecast: false },
  { week: "W12", actual: 7.10, p10: null, p50: null, p90: null, ar: 870,  ap: 590,  isForecast: false },
  // Current week — bands start here
  { week: "W13", actual: 6.97, p10: 6.97, p50: 6.97, p90: 6.97, ar: 720,  ap: 680,  isForecast: false },
  // Forecast weeks
  { week: "W14", actual: null, p10: 6.55, p50: 6.92, p90: 7.38, ar: 750,  ap: 720,  isForecast: true },
  { week: "W15", actual: null, p10: 6.18, p50: 6.85, p90: 7.60, ar: 800,  ap: 680,  isForecast: true },
  { week: "W16", actual: null, p10: 5.88, p50: 6.91, p90: 7.82, ar: 920,  ap: 640,  isForecast: true },
  { week: "W17", actual: null, p10: 5.62, p50: 6.78, p90: 7.95, ar: 680,  ap: 750,  isForecast: true },
  { week: "W18", actual: null, p10: 5.30, p50: 6.65, p90: 8.10, ar: 700,  ap: 810,  isForecast: true },
  { week: "W19", actual: null, p10: 5.05, p50: 6.71, p90: 8.32, ar: 870,  ap: 620,  isForecast: true },
  { week: "W20", actual: null, p10: 4.82, p50: 6.60, p90: 8.45, ar: 750,  ap: 700,  isForecast: true },
  { week: "W21", actual: null, p10: 4.55, p50: 6.55, p90: 8.58, ar: 810,  ap: 680,  isForecast: true },
  { week: "W22", actual: null, p10: 4.30, p50: 6.62, p90: 8.72, ar: 920,  ap: 580,  isForecast: true },
  { week: "W23", actual: null, p10: 4.10, p50: 6.70, p90: 8.91, ar: 780,  ap: 730,  isForecast: true },
  { week: "W24", actual: null, p10: 3.88, p50: 6.78, p90: 9.10, ar: 840,  ap: 660,  isForecast: true },
  { week: "W25", actual: null, p10: 3.70, p50: 6.88, p90: 9.30, ar: 900,  ap: 620,  isForecast: true },
];

// ─────────────────────────────────────────────────────────────────────────────
// SHARED CHART STYLES
// ─────────────────────────────────────────────────────────────────────────────
const chartMargin = { top: 10, right: 16, left: -12, bottom: 0 };

const axisProps = {
  tick:     { fill: C.muted, fontSize: 11 },
  axisLine: { stroke: C.grid },
  tickLine: false,
};

const tooltipBase = {
  background:   C.card,
  border:       `1px solid ${C.grid}`,
  borderRadius: "8px",
  color:        C.text,
  fontSize:     12,
  padding:      "8px 12px",
};

// ─────────────────────────────────────────────────────────────────────────────
// CUSTOM TOOLTIPS
// ─────────────────────────────────────────────────────────────────────────────
function FanTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const get = (key: string) => payload.find((p: any) => p.dataKey === key)?.value;
  const actual = get("actual");
  const p50    = get("p50");
  const p90    = get("p90");
  const p10    = get("p10");

  return (
    <div style={tooltipBase}>
      <p className="font-medium text-white mb-1">{label}</p>
      {actual != null && (
        <p style={{ color: C.green }} className="font-mono text-xs">
          Actual &nbsp;&nbsp;${actual.toFixed(2)}M
        </p>
      )}
      {p90 != null && (
        <>
          <p style={{ color: C.green }} className="font-mono text-xs">P90 (opt) ${p90.toFixed(2)}M</p>
          <p style={{ color: C.blue  }} className="font-mono text-xs">P50 (mid) ${p50?.toFixed(2)}M</p>
          <p style={{ color: C.red   }} className="font-mono text-xs">P10 (pes) ${p10?.toFixed(2)}M</p>
        </>
      )}
    </div>
  );
}

function WaterfallTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const ar  = payload.find((p: any) => p.dataKey === "ar")?.value  ?? 0;
  const ap  = payload.find((p: any) => p.dataKey === "ap")?.value  ?? 0;
  const net = ar - ap;
  return (
    <div style={tooltipBase}>
      <p className="font-medium text-white mb-1">{label}</p>
      <p style={{ color: C.green }} className="font-mono text-xs">AR receipts  +${ar}K</p>
      <p style={{ color: C.red   }} className="font-mono text-xs">AP payments  −${ap}K</p>
      <p
        style={{ color: net >= 0 ? C.green : C.red }}
        className="font-mono text-xs border-t border-navy-border mt-1 pt-1"
      >
        Net &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
        {net >= 0 ? "+" : ""}${net}K
      </p>
    </div>
  );
}

function NetFlowTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value;
  return (
    <div style={tooltipBase}>
      <p className="font-medium text-white mb-1">{label}</p>
      <p
        style={{ color: val >= 0 ? C.green : C.red }}
        className="font-mono text-xs"
      >
        Net {val >= 0 ? "+" : ""}{val}K
      </p>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SCENARIO TOGGLE BUTTON
// ─────────────────────────────────────────────────────────────────────────────
function ScenarioBtn({
  label,
  sublabel,
  active,
  signal,
  onClick,
}: {
  label: string;
  sublabel: string;
  active: boolean;
  signal: "green" | "amber" | "red";
  onClick: () => void;
}) {
  const palette = {
    green: { a: "border-signal-green bg-signal-green/10 text-signal-green", i: "border-navy-border text-signal-muted hover:border-signal-green/50" },
    amber: { a: "border-signal-amber bg-signal-amber/10 text-signal-amber", i: "border-navy-border text-signal-muted hover:border-signal-amber/50" },
    red:   { a: "border-signal-red   bg-signal-red/10   text-signal-red",   i: "border-navy-border text-signal-muted hover:border-signal-red/50"   },
  };
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-start px-4 py-3 rounded-xl border text-left transition-all ${
        active ? palette[signal].a : palette[signal].i
      }`}
    >
      <span className="text-sm font-medium">{label}</span>
      <span className="text-xs opacity-70 mt-0.5">{sublabel}</span>
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SECTION TITLE
// ─────────────────────────────────────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-medium text-signal-muted uppercase tracking-widest mb-3 mt-8">
      {children}
    </h2>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function CashForecastPage() {
  const [scenario, setScenario] = useState<ScenarioKey>("base");
  const active = SCENARIOS[scenario];

  // Apply scenario delta to forecast rows only
  const chartData = BASE_DATA.map((row) => {
    if (!row.isForecast || row.week === "W13") return row;
    const d = active.delta;
    return {
      ...row,
      p10: row.p10 !== null ? +(row.p10 + d).toFixed(2) : null,
      p50: row.p50 !== null ? +(row.p50 + d).toFixed(2) : null,
      p90: row.p90 !== null ? +(row.p90 + d).toFixed(2) : null,
    };
  });

  // Net cash flow per week for the waterfall chart
  const waterfallData = chartData.map((r) => ({
    week: r.week,
    ar:   r.ar,
    ap:   r.ap,
    net:  r.ar - r.ap,
  }));

  // KPI derivations
  const w25       = chartData.find((r) => r.week === "W25");
  const p50End    = w25?.p50  ?? 0;
  const p10End    = w25?.p10  ?? 0;
  const p90End    = w25?.p90  ?? 0;
  const minFloor  = 4.0; // CAD $4M operating minimum
  const breachW   = chartData.find((r) => r.isForecast && (r.p10 ?? 99) < minFloor);
  const runwayTxt = breachW ? `Breach risk at ${breachW.week}` : "> W25 (safe)";

  // Dynamic banner
  const bannerMessages: Record<ScenarioKey, string> = {
    base:
      `Base P50 reaches $${p50End.toFixed(2)}M by W25. No liquidity risk under base assumptions. Monitor DSCR covenant independently.`,
    customer_late:
      `C-0012 delay of $820K drops P50 to $${p50End.toFixed(2)}M. P10 approaches the $4M floor at ${breachW?.week ?? "W25+"}. Accelerate collections.`,
    rate_shock:
      `+200bps shock adds ~$38K/week to debt service. P50 at W25: $${p50End.toFixed(2)}M. Recommend reviewing fixed vs floating debt split.`,
    combined:
      `Combined stress P10 hits $${p10End.toFixed(2)}M by W25 — below the $4M operating floor. Immediate capex freeze and AR acceleration required.`,
  };

  return (
    <div>
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Cash Flow Forecast</h1>
        <p className="text-signal-muted text-sm mt-1">
          13-week probabilistic forecast · P10 / P50 / P90 confidence bands
        </p>
      </div>

      {/* ── Prescriptive banner ───────────────────────────────────────── */}
      <InsightBanner
        title={`${active.label} — Cash Outlook`}
        message={bannerMessages[scenario]}
        signal={active.signal}
        updated={new Date().toISOString()}
      />

      {/* ── Scenario toggles ──────────────────────────────────────────── */}
      <SectionTitle>Stress Scenario</SectionTitle>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-2">
        {(Object.entries(SCENARIOS) as [ScenarioKey, typeof SCENARIOS[ScenarioKey]][]).map(
          ([key, s]) => (
            <ScenarioBtn
              key={key}
              label={s.label}
              sublabel={s.sublabel}
              active={scenario === key}
              signal={s.signal}
              onClick={() => setScenario(key)}
            />
          )
        )}
      </div>

      {/* ── KPI row ───────────────────────────────────────────────────── */}
      <SectionTitle>Key Metrics</SectionTitle>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Current Cash (W13)"
          value="$6.97M"
          signal="amber"
          caption="Actual · AP/AR net"
        />
        <KPICard
          label="P50 at Week 25"
          value={`$${p50End.toFixed(2)}M`}
          delta={`P90: $${p90End.toFixed(2)}M`}
          signal={p50End >= 6 ? "green" : p50End >= 4.5 ? "amber" : "red"}
          caption={active.label}
        />
        <KPICard
          label="P10 at Week 25"
          value={`$${p10End.toFixed(2)}M`}
          signal={p10End >= 5 ? "green" : p10End >= 4 ? "amber" : "red"}
          caption="Pessimistic bound"
        />
        <KPICard
          label="Floor Breach Risk"
          value={breachW ? breachW.week : "None"}
          signal={breachW ? "red" : "green"}
          caption={runwayTxt}
        />
      </div>

      {/* ── Fan chart ─────────────────────────────────────────────────── */}
      <SectionTitle>Probabilistic Cash Position</SectionTitle>
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-1">
          <div>
            <p className="text-white text-sm font-medium">
              13-Week Cash Forecast — {active.label}
            </p>
            <p className="text-signal-muted text-xs mt-0.5">
              Shaded band = P10–P90 · Blue line = P50 median · Green = actuals
            </p>
          </div>
          {/* Live scenario badge */}
          <span
            className={`text-xs font-medium px-3 py-1 rounded-full border self-start sm:self-auto ${
              active.signal === "green"
                ? "border-signal-green text-signal-green bg-signal-green/10"
                : active.signal === "amber"
                ? "border-signal-amber text-signal-amber bg-signal-amber/10"
                : "border-signal-red text-signal-red bg-signal-red/10"
            }`}
          >
            {active.label}
          </span>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <ComposedChart data={chartData} margin={chartMargin}>
            <defs>
              {/* P10–P90 band fill */}
              <linearGradient id="bandFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={C.blue} stopOpacity={0.20} />
                <stop offset="100%" stopColor={C.blue} stopOpacity={0.04} />
              </linearGradient>
              {/* Stress scenario band — red tint */}
              <linearGradient id="stressFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={C.red} stopOpacity={0.15} />
                <stop offset="100%" stopColor={C.red} stopOpacity={0.03} />
              </linearGradient>
            </defs>

            <CartesianGrid stroke={C.grid} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="week" {...axisProps} interval={1} />
            <YAxis
              domain={[2, 10.5]}
              {...axisProps}
              tickFormatter={(v) => `$${v}M`}
            />
            <Tooltip content={<FanTooltip />} />

            {/* "Today" divider */}
            <ReferenceLine
              x="W13"
              stroke={C.muted}
              strokeDasharray="4 3"
              label={{ value: "Today", position: "top", fill: C.muted, fontSize: 10 }}
            />

            {/* $4M operating minimum floor */}
            <ReferenceLine
              y={minFloor}
              stroke={C.red}
              strokeDasharray="3 2"
              strokeWidth={1}
              label={{
                value: `$${minFloor}M floor`,
                position: "insideTopRight",
                fill: C.red,
                fontSize: 10,
              }}
            />

            {/* P90 top of band */}
            <Area
              type="monotone"
              dataKey="p90"
              stroke="none"
              fill={scenario === "base" ? "url(#bandFill)" : "url(#stressFill)"}
              fillOpacity={1}
              legendType="none"
              activeDot={false}
            />

            {/* P10 bottom of band — bg fill cancels gradient below it */}
            <Area
              type="monotone"
              dataKey="p10"
              stroke={C.red}
              strokeWidth={1.5}
              strokeDasharray="4 3"
              fill={C.bg}
              fillOpacity={1}
              dot={false}
              activeDot={false}
              legendType="none"
            />

            {/* P50 median line */}
            <Line
              type="monotone"
              dataKey="p50"
              stroke={C.blue}
              strokeWidth={2.5}
              dot={false}
              activeDot={{ r: 4, fill: C.blue, strokeWidth: 0 }}
            />

            {/* Actual cash — solid dots */}
            <Line
              type="monotone"
              dataKey="actual"
              stroke={C.green}
              strokeWidth={2}
              dot={{ r: 3, fill: C.green, strokeWidth: 0 }}
              activeDot={{ r: 5, fill: C.green, strokeWidth: 0 }}
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>

        {/* Legend row */}
        <div className="flex flex-wrap gap-5 mt-3 pt-3 border-t border-navy-border text-xs text-signal-muted">
          <span className="flex items-center gap-2">
            <span className="w-6 h-[2px] inline-block rounded" style={{ background: C.green }} />
            Actual
          </span>
          <span className="flex items-center gap-2">
            <span className="w-6 h-[2px] inline-block rounded" style={{ background: C.blue }} />
            P50 Median
          </span>
          <span className="flex items-center gap-2">
            <span
              className="w-6 h-3 inline-block rounded opacity-40"
              style={{ background: C.blue }}
            />
            P10–P90 Band
          </span>
          <span className="flex items-center gap-2">
            <span
              className="w-6 h-[2px] inline-block"
              style={{
                background: `repeating-linear-gradient(90deg, ${C.red} 0 4px, transparent 4px 7px)`,
              }}
            />
            P10 Pessimistic
          </span>
          <span className="flex items-center gap-2">
            <span
              className="w-6 h-[2px] inline-block"
              style={{
                background: `repeating-linear-gradient(90deg, ${C.red} 0 3px, transparent 3px 5px)`,
              }}
            />
            $4M Floor
          </span>
        </div>
      </div>

      {/* ── AP vs AR waterfall + net flow ─────────────────────────────── */}
      <SectionTitle>Weekly Cash Movements</SectionTitle>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* AP vs AR grouped bar */}
        <div className="card">
          <p className="text-white text-sm font-medium mb-0.5">
            AR Receipts vs AP Payments
          </p>
          <p className="text-signal-muted text-xs mb-4">Weekly $K CAD · all weeks</p>

          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={waterfallData} margin={chartMargin} barGap={2} barCategoryGap="30%">
              <CartesianGrid stroke={C.grid} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="week" {...axisProps} interval={2} />
              <YAxis {...axisProps} tickFormatter={(v) => `$${v}K`} />
              <Tooltip content={<WaterfallTooltip />} cursor={{ fill: C.grid, opacity: 0.3 }} />
              <Bar dataKey="ar" fill={C.green} opacity={0.85} radius={[3, 3, 0, 0]} name="AR" />
              <Bar dataKey="ap" fill={C.red}   opacity={0.75} radius={[3, 3, 0, 0]} name="AP" />
            </BarChart>
          </ResponsiveContainer>

          <div className="flex gap-5 mt-2 text-xs text-signal-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm inline-block" style={{ background: C.green }} />
              AR Receipts
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm inline-block" style={{ background: C.red }} />
              AP Payments
            </span>
          </div>
        </div>

        {/* Net cash flow area chart */}
        <div className="card">
          <p className="text-white text-sm font-medium mb-0.5">
            Net Weekly Cash Flow
          </p>
          <p className="text-signal-muted text-xs mb-4">AR minus AP · positive = cash inflow · $K</p>

          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={waterfallData} margin={chartMargin}>
              <defs>
                <linearGradient id="netPos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C.green} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={C.green} stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="netNeg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C.red} stopOpacity={0.20} />
                  <stop offset="95%" stopColor={C.red} stopOpacity={0.02} />
                </linearGradient>
              </defs>

              <CartesianGrid stroke={C.grid} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="week" {...axisProps} interval={2} />
              <YAxis
                {...axisProps}
                tickFormatter={(v) => `${v > 0 ? "+" : ""}${v}K`}
              />
              <Tooltip content={<NetFlowTooltip />} cursor={{ stroke: C.muted, strokeWidth: 1 }} />

              {/* Zero reference line */}
              <ReferenceLine
                y={0}
                stroke={C.muted}
                strokeDasharray="3 3"
                strokeWidth={1}
              />

              <Area
                type="monotone"
                dataKey="net"
                stroke={C.blue}
                strokeWidth={2}
                fill="url(#netPos)"
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  const colour = payload.net >= 0 ? C.green : C.red;
                  return (
                    <circle
                      key={`net-dot-${payload.week}`}
                      cx={cx} cy={cy} r={3}
                      fill={colour} strokeWidth={0}
                    />
                  );
                }}
              />
            </AreaChart>
          </ResponsiveContainer>

          <div className="flex gap-5 mt-2 text-xs text-signal-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full inline-block" style={{ background: C.green }} />
              Cash inflow week
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full inline-block" style={{ background: C.red }} />
              Cash outflow week
            </span>
          </div>
        </div>
      </div>

      {/* ── Methodology ───────────────────────────────────────────────── */}
      <p className="text-xs text-signal-muted mt-8 border-t border-navy-border pt-4">
        P10/P50/P90 bands: XGBoost trained on 8 quarters of AR/AP transactional data,
        macro-adjusted for BoC rate trajectory. Stress deltas computed via DoubleML
        causal model (CATE). All inference runs in-browser via ONNX Runtime Web —
        no data leaves your device.
      </p>
    </div>
  );
}