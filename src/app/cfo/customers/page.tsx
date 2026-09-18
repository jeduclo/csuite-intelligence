// src/app/cfo/customers/page.tsx
//
// Answers:
//   1. Which customers will default before they miss a payment?
//   2. What is our revenue concentration risk?
//
// Charts:
//   - Risk-scored customer table with DSO sparklines
//   - Revenue concentration bar (top 5 / top 10 / rest)
//   - DSO trend by risk cohort (High / Medium / Low)
//   - Default probability histogram
"use client";

import { useState } from "react";
import {
  LineChart, Line,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
} from "recharts";
import { KPICard }       from "@/components/ui/KPICard";
import { InsightBanner } from "@/components/ui/InsightBanner";

// ─── Colours ──────────────────────────────────────────────────────────────
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

// ─── Shared chart styles ───────────────────────────────────────────────────
const chartMargin = { top: 8, right: 16, left: -8, bottom: 0 };
const axisProps   = {
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

// ─── DATA ─────────────────────────────────────────────────────────────────

// Customer risk table data
// defaultProb: XGBoost 60-day default probability (0–100)
// dso: current days sales outstanding
// dsoTrend: last 6 months DSO (for sparkline)
// revShare: % of total revenue
// risk: "High" | "Medium" | "Low"
// topDrivers: top 3 SHAP features driving the score
const customers = [
  {
    id: "C-0047",
    name: "Meridian Supply Co.",
    defaultProb: 71,
    dso: 68,
    dsoTrend: [32, 38, 44, 51, 60, 68],
    revShare: 8.4,
    outstandingAR: 420,
    risk: "High" as const,
    topDrivers: ["Rising DSO", "Sector exposure", "High concentration"],
  },
  {
    id: "C-0012",
    name: "Kestrel Industrial",
    defaultProb: 63,
    dso: 59,
    dsoTrend: [28, 33, 40, 47, 54, 59],
    revShare: 11.2,
    outstandingAR: 820,
    risk: "High" as const,
    topDrivers: ["DSO acceleration", "Invoice size spike", "Payment pattern shift"],
  },
  {
    id: "C-0031",
    name: "Boreal Logistics",
    defaultProb: 54,
    dso: 52,
    dsoTrend: [30, 34, 38, 43, 48, 52],
    revShare: 6.1,
    outstandingAR: 310,
    risk: "High" as const,
    topDrivers: ["Slow-pay trend", "Q3 sector contraction", "Partial payments"],
  },
  {
    id: "C-0008",
    name: "Granite Peak Corp.",
    defaultProb: 31,
    dso: 38,
    dsoTrend: [29, 31, 33, 35, 37, 38],
    revShare: 9.8,
    outstandingAR: 185,
    risk: "Medium" as const,
    topDrivers: ["Slight DSO creep", "Sector softness", "Concentration"],
  },
  {
    id: "C-0019",
    name: "Cascade Materials",
    defaultProb: 24,
    dso: 33,
    dsoTrend: [28, 29, 31, 32, 33, 33],
    revShare: 7.3,
    outstandingAR: 142,
    risk: "Medium" as const,
    topDrivers: ["Stable but rising", "Macro exposure", "Single invoice concentration"],
  },
  {
    id: "C-0055",
    name: "Northgate Partners",
    defaultProb: 12,
    dso: 24,
    dsoTrend: [26, 25, 24, 24, 23, 24],
    revShare: 5.2,
    outstandingAR: 88,
    risk: "Low" as const,
    topDrivers: ["On-time payer", "Low concentration", "Strong sector"],
  },
  {
    id: "C-0003",
    name: "Summit Resources",
    defaultProb: 9,
    dso: 21,
    dsoTrend: [22, 21, 22, 20, 21, 21],
    revShare: 12.1,
    outstandingAR: 64,
    risk: "Low" as const,
    topDrivers: ["Consistent early pay", "Large stable account", "Macro resilient"],
  },
  {
    id: "C-0041",
    name: "Tundra Fabrication",
    defaultProb: 7,
    dso: 19,
    dsoTrend: [20, 19, 19, 18, 19, 19],
    revShare: 4.8,
    outstandingAR: 52,
    risk: "Low" as const,
    topDrivers: ["Best payer", "Diversified revenue", "Low AR balance"],
  },
];

// Revenue concentration data — for bar chart
const concentrationData = [
  { label: "Top 1",   pct: 12.1, cumPct: 12.1 },
  { label: "Top 2",   pct: 11.2, cumPct: 23.3 },
  { label: "Top 3",   pct: 9.8,  cumPct: 33.1 },
  { label: "Top 4",   pct: 8.4,  cumPct: 41.5 },
  { label: "Top 5",   pct: 7.3,  cumPct: 48.8 },
  { label: "6–10",    pct: 18.2, cumPct: 67.0 },
  { label: "11–20",   pct: 16.8, cumPct: 83.8 },
  { label: "Rest",    pct: 16.2, cumPct: 100  },
];

// DSO trend by risk cohort — 6 months
const dsoTrendData = [
  { month: "Apr", High: 30, Medium: 29, Low: 23 },
  { month: "May", High: 35, Medium: 30, Low: 22 },
  { month: "Jun", High: 41, Medium: 31, Low: 23 },
  { month: "Jul", High: 47, Medium: 33, Low: 23 },
  { month: "Aug", High: 54, Medium: 34, Low: 22 },
  { month: "Sep", High: 60, Medium: 35, Low: 21 },
];

// Default probability histogram
const probHistData = [
  { bucket: "0–10%",   count: 28 },
  { bucket: "11–20%",  count: 19 },
  { bucket: "21–30%",  count: 12 },
  { bucket: "31–40%",  count: 8  },
  { bucket: "41–50%",  count: 5  },
  { bucket: "51–60%",  count: 4  },
  { bucket: "61–70%",  count: 2  },
  { bucket: "71–80%",  count: 2  },
];

// ─── Risk badge ────────────────────────────────────────────────────────────
function RiskBadge({ prob }: { prob: number }) {
  const { colour, label } =
    prob >= 60 ? { colour: C.red,   label: "High"   } :
    prob >= 30 ? { colour: C.amber, label: "Medium" } :
                 { colour: C.green, label: "Low"    };
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{ background: `${colour}20`, color: colour, border: `1px solid ${colour}40` }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full inline-block"
        style={{ background: colour }}
      />
      {prob}% · {label}
    </span>
  );
}

// ─── Inline DSO sparkline ──────────────────────────────────────────────────
function DSPSparkline({ data, risk }: { data: number[]; risk: "High" | "Medium" | "Low" }) {
  const colour = risk === "High" ? C.red : risk === "Medium" ? C.amber : C.green;
  const max    = Math.max(...data);
  const min    = Math.min(...data);
  const range  = max - min || 1;
  const w = 64, h = 24, pad = 2;

  const points = data.map((v, i) => {
    const x = pad + (i / (data.length - 1)) * (w - pad * 2);
    const y = pad + (1 - (v - min) / range) * (h - pad * 2);
    return `${x},${y}`;
  }).join(" ");

  return (
    <svg width={w} height={h} className="inline-block">
      <polyline
        points={points}
        fill="none"
        stroke={colour}
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity={0.9}
      />
      {/* Last point dot */}
      {(() => {
        const last = data[data.length - 1];
        const x = w - pad;
        const y = pad + (1 - (last - min) / range) * (h - pad * 2);
        return <circle cx={x} cy={y} r={2.5} fill={colour} />;
      })()}
    </svg>
  );
}

// ─── Sort types ────────────────────────────────────────────────────────────
type SortKey = "defaultProb" | "dso" | "revShare" | "outstandingAR";

// ─── Section title ─────────────────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-medium text-signal-muted uppercase tracking-widest mb-3 mt-8">
      {children}
    </h2>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────
export default function CustomerRiskPage() {
  const [sortKey, setSortKey]     = useState<SortKey>("defaultProb");
  const [showDrivers, setShowDrivers] = useState<string | null>(null);

  const sorted = [...customers].sort((a, b) => b[sortKey] - a[sortKey]);

  const highRiskCount  = customers.filter((c) => c.defaultProb >= 60).length;
  const highRiskAR     = customers.filter((c) => c.defaultProb >= 60)
                                  .reduce((s, c) => s + c.outstandingAR, 0);
  const top5Conc       = concentrationData.slice(0, 5).reduce((s, r) => s + r.pct, 0);
  const avgDSOHigh     = dsoTrendData[dsoTrendData.length - 1].High;

  return (
    <div>
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Customer Risk</h1>
        <p className="text-signal-muted text-sm mt-1">
          60-day default probability · DSO trend · revenue concentration
        </p>
      </div>

      {/* ── Banner ────────────────────────────────────────────────────── */}
      <InsightBanner
        title="3 customers show high default probability — $1.55M AR at risk"
        message="C-0047 (Meridian Supply) has a 71% 60-day default probability driven by rising DSO (+36d in 6 months), sector exposure, and high invoice concentration. C-0012 (Kestrel Industrial) carries $820K of outstanding AR. Recommend credit hold review for both and accelerated collection outreach before month-end."
        signal="red"
        updated={new Date().toISOString()}
      />

      {/* ── KPIs ──────────────────────────────────────────────────────── */}
      <SectionTitle>Portfolio Risk Summary</SectionTitle>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="High-Risk Accounts"
          value={`${highRiskCount} customers`}
          delta={`$${highRiskCount * 500}K avg exposure`}
          signal="red"
          caption="≥ 60% 60-day default probability"
        />
        <KPICard
          label="AR at Risk"
          value={`$${highRiskCount === 3 ? "1.55" : "0"}M`}
          delta="High-risk accounts only"
          signal="red"
          caption="Outstanding AR from high-risk cohort"
        />
        <KPICard
          label="Top 5 Revenue Concentration"
          value={`${top5Conc.toFixed(1)}%`}
          delta="Herfindahl risk: Moderate"
          signal="amber"
          caption="Top 5 customers as % of total revenue"
        />
        <KPICard
          label="High-Risk Cohort DSO"
          value={`${avgDSOHigh}d`}
          delta="+30d vs 6 months ago"
          signal="red"
          caption="Average DSO, high-risk accounts"
        />
      </div>

      {/* ── Customer risk table ───────────────────────────────────────── */}
      <SectionTitle>Customer Risk Scores</SectionTitle>
      <div className="card overflow-x-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
          <div>
            <p className="text-white text-sm font-medium">60-Day Default Probability</p>
            <p className="text-signal-muted text-xs mt-0.5">
              XGBoost model · DSO trend + concentration + sector · click row for SHAP drivers
            </p>
          </div>
          {/* Sort controls */}
          <div className="flex gap-2 flex-wrap">
            {(
              [
                ["defaultProb", "Default %"],
                ["dso",         "DSO"],
                ["revShare",    "Rev %"],
                ["outstandingAR","AR $K"],
              ] as [SortKey, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSortKey(key)}
                className={`px-3 py-1 rounded-full text-xs border transition-all ${
                  sortKey === key
                    ? "border-signal-blue bg-signal-blue/10 text-signal-blue"
                    : "border-navy-border text-signal-muted hover:border-signal-blue/40"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Table — scrollable on mobile */}
        <div className="min-w-[640px]">
          {/* Header */}
          <div className="grid grid-cols-[1fr_90px_72px_80px_72px_80px] gap-3 px-3 py-2 border-b border-navy-border">
            {["Customer", "Default Risk", "DSO", "DSO Trend", "Rev %", "AR $K"].map((h) => (
              <p key={h} className="text-xs text-signal-muted uppercase tracking-wider">{h}</p>
            ))}
          </div>

          {/* Rows */}
          {sorted.map((c) => {
            const isExpanded = showDrivers === c.id;
            const rowColour  =
              c.defaultProb >= 60 ? `border-l-signal-red`   :
              c.defaultProb >= 30 ? `border-l-signal-amber` :
                                    `border-l-signal-green`;
            return (
              <div key={c.id}>
                <button
                  onClick={() => setShowDrivers(isExpanded ? null : c.id)}
                  className={`w-full grid grid-cols-[1fr_90px_72px_80px_72px_80px] gap-3 px-3 py-3 border-b border-navy-border border-l-2 ${rowColour} hover:bg-navy-border/20 transition-colors text-left`}
                >
                  {/* Name + ID */}
                  <div>
                    <p className="text-white text-sm font-medium">{c.name}</p>
                    <p className="text-signal-muted text-xs">{c.id}</p>
                  </div>

                  {/* Default probability badge */}
                  <div className="flex items-center">
                    <RiskBadge prob={c.defaultProb} />
                  </div>

                  {/* DSO current */}
                  <p className="font-mono text-sm text-white self-center">
                    {c.dso}d
                  </p>

                  {/* DSO sparkline */}
                  <div className="self-center">
                    <DSPSparkline data={c.dsoTrend} risk={c.risk} />
                  </div>

                  {/* Revenue share */}
                  <p className="font-mono text-sm text-white self-center">
                    {c.revShare}%
                  </p>

                  {/* Outstanding AR */}
                  <p className="font-mono text-sm self-center"
                     style={{ color: c.outstandingAR > 300 ? C.red : c.outstandingAR > 150 ? C.amber : C.green }}>
                    ${c.outstandingAR}K
                  </p>
                </button>

                {/* Expandable SHAP drivers row */}
                {isExpanded && (
                  <div className="px-3 py-3 bg-navy-border/10 border-b border-navy-border">
                    <p className="text-xs text-signal-muted mb-2">
                      Top 3 model drivers (SHAP attribution):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {c.topDrivers.map((d, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 rounded-full text-xs"
                          style={{
                            background: `${C.amber}15`,
                            color: C.amber,
                            border: `1px solid ${C.amber}30`,
                          }}
                        >
                          {i + 1}. {d}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Charts row ────────────────────────────────────────────────── */}
      <SectionTitle>Concentration & DSO Cohort Analysis</SectionTitle>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Revenue concentration bar */}
        <div className="card">
          <p className="text-white text-sm font-medium">Revenue Concentration</p>
          <p className="text-signal-muted text-xs mt-0.5 mb-4">
            % of total revenue by customer tier · top 5 = {top5Conc.toFixed(1)}% of book
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={concentrationData}
              layout="vertical"
              margin={{ top: 4, right: 56, left: 8, bottom: 4 }}
              barCategoryGap="22%"
            >
              <CartesianGrid stroke={C.grid} strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" {...axisProps} tickFormatter={(v) => `${v}%`} domain={[0, 22]} />
              <YAxis type="category" dataKey="label" {...axisProps} width={44} />
              <Tooltip
                contentStyle={tooltipBase}
                formatter={(v: any) => [`${Number(v).toFixed(1)}%`, "Revenue share"]}
                cursor={{ fill: C.grid, opacity: 0.3 }}
              />
              <Bar dataKey="pct" radius={[0, 4, 4, 0]} barSize={18}>
                {concentrationData.map((_, i) => (
                  <Cell
                    key={i}
                    fill={i < 3 ? C.red : i < 5 ? C.amber : C.blue}
                    fillOpacity={0.80}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 text-xs text-signal-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm" style={{ background: C.red }} />
              Top 3 (high conc. risk)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm" style={{ background: C.amber }} />
              Top 4–5
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm" style={{ background: C.blue }} />
              Rest of book
            </span>
          </div>
        </div>

        {/* DSO trend by risk cohort */}
        <div className="card">
          <p className="text-white text-sm font-medium">DSO Trend by Risk Cohort</p>
          <p className="text-signal-muted text-xs mt-0.5 mb-4">
            Average days sales outstanding · High / Medium / Low risk · last 6 months
          </p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={dsoTrendData} margin={chartMargin}>
              <CartesianGrid stroke={C.grid} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" {...axisProps} />
              <YAxis {...axisProps} tickFormatter={(v) => `${v}d`} domain={[15, 70]} />
              <Tooltip
                contentStyle={tooltipBase}
                formatter={(v: any, name: string) => [`${v}d`, name]}
              />
              <ReferenceLine
                y={30}
                stroke={C.muted}
                strokeDasharray="3 2"
                label={{ value: "30d terms", position: "insideTopRight", fill: C.muted, fontSize: 10 }}
              />
              <Line type="monotone" dataKey="High"   stroke={C.red}   strokeWidth={2.5} dot={{ r: 3, fill: C.red,   strokeWidth: 0 }} />
              <Line type="monotone" dataKey="Medium" stroke={C.amber} strokeWidth={2}   dot={{ r: 3, fill: C.amber, strokeWidth: 0 }} />
              <Line type="monotone" dataKey="Low"    stroke={C.green} strokeWidth={2}   dot={{ r: 3, fill: C.green, strokeWidth: 0 }} />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex gap-5 mt-2 text-xs text-signal-muted">
            {[["High", C.red], ["Medium", C.amber], ["Low", C.green]].map(([l, c]) => (
              <span key={l} className="flex items-center gap-1.5">
                <span className="w-6 h-[2px] inline-block rounded" style={{ background: c }} />
                {l}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* ── Default probability histogram ─────────────────────────────── */}
      <SectionTitle>Default Probability Distribution</SectionTitle>
      <div className="card">
        <p className="text-white text-sm font-medium">
          Portfolio Distribution — 60-Day Default Probability
        </p>
        <p className="text-signal-muted text-xs mt-0.5 mb-4">
          Customer count by probability bucket · {customers.length} accounts shown of 80 total
        </p>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={probHistData} margin={chartMargin} barCategoryGap="20%">
            <CartesianGrid stroke={C.grid} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="bucket" {...axisProps} tick={{ fill: C.muted, fontSize: 10 }} />
            <YAxis {...axisProps} tickFormatter={(v) => `${v}`} />
            <Tooltip
              contentStyle={tooltipBase}
              formatter={(v: any) => [`${v} customers`, "Count"]}
              cursor={{ fill: C.grid, opacity: 0.3 }}
            />
            <ReferenceLine x="41–50%" stroke={C.amber} strokeDasharray="3 2" />
            <ReferenceLine x="61–70%" stroke={C.red}   strokeDasharray="3 2" />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>
              {probHistData.map((d, i) => (
                <Cell
                  key={i}
                  fill={
                    d.bucket.startsWith("6") || d.bucket.startsWith("7")
                      ? C.red
                      : d.bucket.startsWith("3") || d.bucket.startsWith("4") || d.bucket.startsWith("5")
                      ? C.amber
                      : C.blue
                  }
                  fillOpacity={0.82}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex gap-5 mt-2 text-xs text-signal-muted">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm" style={{ background: C.blue }} />
            Low risk (0–20%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm" style={{ background: C.amber }} />
            Medium (21–59%)
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-sm" style={{ background: C.red }} />
            High (&ge;60%)
          </span>
        </div>
      </div>

      {/* ── Methodology ───────────────────────────────────────────────── */}
      <p className="text-xs text-signal-muted mt-8 border-t border-navy-border pt-4">
        Default probability: XGBoost classifier trained on 8 quarters of AR aging data.
        Features: DSO trend slope, invoice concentration ratio, payment velocity, sector
        macro score. SHAP values computed at inference time. All models run in-browser
        via ONNX Runtime Web — no data leaves your device.
      </p>
    </div>
  );
}