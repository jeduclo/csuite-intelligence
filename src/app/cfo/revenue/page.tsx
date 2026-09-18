// src/app/cfo/revenue/page.tsx
//
// Answers:
//   1. Which channels / regions are driving or dragging margin?
//   2. What will revenue look like next quarter?
//   3. Where exactly is the margin compression coming from?
//
// Charts:
//   - Monthly revenue by channel (stacked bar)
//   - Margin bridge: price / volume / mix / cost waterfall
//   - Quarterly forecast fan (P10/P50/P90)
//   - SKU contribution Pareto (top 10 + bottom 5)
"use client";

import { useState } from "react";
import {
  BarChart, Bar,
  ComposedChart, Line, Area,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
  LabelList,
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
  teal:   "#2AACB8",
  muted:  "#A0B4CC",
  grid:   "#1E3A6E",
  card:   "#1A3560",
  bg:     "#0A1628",
  text:   "#C8D8F0",
};

// ─── Shared chart styles ───────────────────────────────────────────────────
const chartMargin = { top: 10, right: 16, left: -8, bottom: 0 };
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

// 1. Monthly revenue by channel — stacked bar
// Direct / Distributor / Online / Partner channels, 9 months
const channelData = [
  { month: "Jan", Direct: 0.48, Distributor: 0.31, Online: 0.24, Partner: 0.18 },
  { month: "Feb", Direct: 0.42, Distributor: 0.28, Online: 0.21, Partner: 0.17 },
  { month: "Mar", Direct: 0.55, Distributor: 0.38, Online: 0.28, Partner: 0.14 },
  { month: "Apr", Direct: 0.46, Distributor: 0.33, Online: 0.25, Partner: 0.14 },
  { month: "May", Direct: 0.52, Distributor: 0.36, Online: 0.27, Partner: 0.14 },
  { month: "Jun", Direct: 0.58, Distributor: 0.41, Online: 0.29, Partner: 0.13 },
  { month: "Jul", Direct: 0.54, Distributor: 0.38, Online: 0.28, Partner: 0.13 },
  { month: "Aug", Direct: 0.49, Distributor: 0.34, Online: 0.26, Partner: 0.13 },
  { month: "Sep", Direct: 0.41, Distributor: 0.30, Online: 0.23, Partner: 0.12 },
];

// Channel margins — used for the margin table below the chart
const channelMargins: Record<string, { margin: number; trend: "up" | "down" | "flat" }> = {
  Direct:      { margin: 42.1, trend: "down" },
  Distributor: { margin: 28.4, trend: "down" },
  Online:      { margin: 51.8, trend: "flat" },
  Partner:     { margin: 22.6, trend: "down" },
};

// 2. Margin bridge — waterfall decomposition
// Each bar is a driver of margin change Q2→Q3.
// Positive = margin improvement, Negative = margin drag.
// "base" and "result" are invisible anchors for the floating bar effect.
const marginBridgeData = [
  { label: "Q2 Margin",    value: 36.0, base: 0,    isAnchor: true  },
  { label: "Price mix",    value: +0.8, base: 36.0, isAnchor: false },
  { label: "Volume",       value: +0.4, base: 36.8, isAnchor: false },
  { label: "Channel mix",  value: -1.1, base: 36.0, isAnchor: false }, // distributor growing faster
  { label: "COGS / IPPI",  value: -1.7, base: 34.3, isAnchor: false }, // input cost pressure
  { label: "SG&A creep",   value: -0.5, base: 33.8, isAnchor: false },
  { label: "Q3 Margin",    value: 34.2, base: 0,    isAnchor: true  },
];

// Pre-compute the floating base for each bridge bar
// Bridge bars float on top of their cumulative base
let runningBase = 36.0;
const bridgeComputed = marginBridgeData.map((d) => {
  if (d.isAnchor) {
    return {
      ...d,
      floatBase: 0,
      barValue:  d.value,
      colour:    d.label === "Q2 Margin" ? C.blue : C.green,
      displayLabel: `${d.value.toFixed(1)}%`,
    };
  }
  const base = d.value >= 0 ? runningBase : runningBase + d.value;
  const bar  = Math.abs(d.value);
  runningBase += d.value;
  return {
    ...d,
    floatBase: base,
    barValue:  bar,
    colour:    d.value >= 0 ? C.green : C.red,
    displayLabel: `${d.value > 0 ? "+" : ""}${d.value.toFixed(1)}pp`,
  };
});

// 3. Quarterly forecast P10/P50/P90
const quarterlyData = [
  { quarter: "Q1 '24", actual: 3.64, p10: null, p50: null, p90: null },
  { quarter: "Q2 '24", actual: 3.88, p10: null, p50: null, p90: null },
  { quarter: "Q3 '24", actual: 3.72, p10: null, p50: null, p90: null },
  { quarter: "Q4 '24", actual: 4.05, p10: null, p50: null, p90: null },
  { quarter: "Q1 '25", actual: 3.81, p10: null, p50: null, p90: null },
  { quarter: "Q2 '25", actual: 4.10, p10: null, p50: null, p90: null },
  { quarter: "Q3 '25", actual: 3.90, p10: null, p50: null, p90: null }, // latest actual
  { quarter: "Q4 '25", actual: null, p10: 3.80, p50: 4.22, p90: 4.68 }, // XGBoost forecast
  { quarter: "Q1 '26", actual: null, p10: 3.95, p50: 4.38, p90: 4.90 },
  { quarter: "Q2 '26", actual: null, p10: 4.10, p50: 4.55, p90: 5.15 },
];

// 4. SKU Pareto — top 8 and bottom 5 by gross margin contribution ($K)
const skuData = [
  // Top contributors (green)
  { sku: "SKU-014", margin: 312, revenue: 1840, marginPct: 41.2, type: "top" },
  { sku: "SKU-007", margin: 278, revenue: 1620, marginPct: 38.9, type: "top" },
  { sku: "SKU-022", margin: 241, revenue: 1280, marginPct: 44.1, type: "top" },
  { sku: "SKU-031", margin: 198, revenue: 920,  marginPct: 52.3, type: "top" },
  { sku: "SKU-003", margin: 187, revenue: 1100, marginPct: 37.8, type: "top" },
  { sku: "SKU-018", margin: 164, revenue: 880,  marginPct: 39.4, type: "top" },
  { sku: "SKU-009", margin: 143, revenue: 760,  marginPct: 40.1, type: "top" },
  { sku: "SKU-025", margin: 128, revenue: 640,  marginPct: 42.7, type: "top" },
  // Bottom contributors (red) — SKU-Group B problem
  { sku: "SKU-038", margin: -42, revenue: 380,  marginPct: -12.1, type: "bottom" },
  { sku: "SKU-011", margin: -28, revenue: 290,  marginPct: -9.4,  type: "bottom" },
  { sku: "SKU-029", margin: -19, revenue: 210,  marginPct: -8.2,  type: "bottom" },
  { sku: "SKU-006", margin: -14, revenue: 180,  marginPct: -7.1,  type: "bottom" },
  { sku: "SKU-033", margin: -9,  revenue: 140,  marginPct: -5.8,  type: "bottom" },
].sort((a, b) => b.margin - a.margin);

// ─── Helper components ─────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-medium text-signal-muted uppercase tracking-widest mb-3 mt-8">
      {children}
    </h2>
  );
}

function ChartCard({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`card ${className}`}>
      <p className="text-white text-sm font-medium">{title}</p>
      {subtitle && <p className="text-signal-muted text-xs mt-0.5 mb-4">{subtitle}</p>}
      {!subtitle && <div className="mb-4" />}
      {children}
    </div>
  );
}

// ─── Custom tooltips ───────────────────────────────────────────────────────

function ChannelTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const total = payload.reduce((s: number, p: any) => s + (p.value ?? 0), 0);
  return (
    <div style={tooltipBase}>
      <p className="font-medium text-white mb-2">{label}</p>
      {payload.map((p: any) => (
        <p key={p.dataKey} style={{ color: p.fill }} className="font-mono text-xs">
          {p.dataKey.padEnd(12)} ${p.value?.toFixed(2)}M
        </p>
      ))}
      <p className="font-mono text-xs text-white border-t border-navy-border mt-1 pt-1">
        Total &nbsp;&nbsp;&nbsp;&nbsp;&nbsp; ${total.toFixed(2)}M
      </p>
    </div>
  );
}

function BridgeTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const d = bridgeComputed.find((r) => r.label === label);
  if (!d) return null;
  return (
    <div style={tooltipBase}>
      <p className="font-medium text-white">{label}</p>
      <p style={{ color: d.isAnchor ? C.blue : d.value >= 0 ? C.green : C.red }} className="font-mono text-xs mt-1">
        {d.isAnchor ? `${d.value.toFixed(1)}%` : `${d.value > 0 ? "+" : ""}${d.value.toFixed(1)}pp`}
      </p>
    </div>
  );
}

function QuarterTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const get = (k: string) => payload.find((p: any) => p.dataKey === k)?.value;
  return (
    <div style={tooltipBase}>
      <p className="font-medium text-white mb-1">{label}</p>
      {get("actual") != null && (
        <p style={{ color: C.green }} className="font-mono text-xs">Actual &nbsp;${get("actual")?.toFixed(2)}M</p>
      )}
      {get("p50") != null && (
        <>
          <p style={{ color: C.green }} className="font-mono text-xs">P90 &nbsp;&nbsp;&nbsp;${get("p90")?.toFixed(2)}M</p>
          <p style={{ color: C.blue  }} className="font-mono text-xs">P50 &nbsp;&nbsp;&nbsp;${get("p50")?.toFixed(2)}M</p>
          <p style={{ color: C.red   }} className="font-mono text-xs">P10 &nbsp;&nbsp;&nbsp;${get("p10")?.toFixed(2)}M</p>
        </>
      )}
    </div>
  );
}

function SKUTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const d = skuData.find((s) => s.sku === label);
  if (!d) return null;
  return (
    <div style={tooltipBase}>
      <p className="font-medium text-white">{label}</p>
      <p style={{ color: d.margin >= 0 ? C.green : C.red }} className="font-mono text-xs mt-1">
        Margin $ &nbsp;{d.margin >= 0 ? "+" : ""}${d.margin}K
      </p>
      <p className="font-mono text-xs" style={{ color: C.muted }}>
        Margin % &nbsp;{d.marginPct.toFixed(1)}%
      </p>
      <p className="font-mono text-xs" style={{ color: C.muted }}>
        Revenue &nbsp;${d.revenue}K
      </p>
    </div>
  );
}

// ─── Region selector (for channel chart) ──────────────────────────────────
type RegionKey = "All" | "Ontario" | "Quebec" | "BC" | "Alberta";
const REGIONS: RegionKey[] = ["All", "Ontario", "Quebec", "BC", "Alberta"];

// Region multipliers — simulate filtering (in real app, DuckDB query)
const regionMultipliers: Record<RegionKey, number> = {
  All: 1.0, Ontario: 0.38, Quebec: 0.24, BC: 0.21, Alberta: 0.17,
};

// ─── PAGE ─────────────────────────────────────────────────────────────────
export default function RevenuePage() {
  const [region, setRegion] = useState<RegionKey>("All");

  const mult = regionMultipliers[region];
  const filteredChannel = channelData.map((row) => ({
    ...row,
    Direct:      +(row.Direct      * mult).toFixed(2),
    Distributor: +(row.Distributor * mult).toFixed(2),
    Online:      +(row.Online      * mult).toFixed(2),
    Partner:     +(row.Partner     * mult).toFixed(2),
  }));

  // Derived KPIs
  const totalRevLTM = channelData.reduce(
    (s, r) => s + r.Direct + r.Distributor + r.Online + r.Partner,
    0
  );
  const avgMonthly  = (totalRevLTM / 9).toFixed(2);
  const topSKUMargin = skuData.filter((s) => s.type === "top").reduce((s, r) => s + r.margin, 0);
  const negSKUDrag   = Math.abs(skuData.filter((s) => s.type === "bottom").reduce((s, r) => s + r.margin, 0));

  return (
    <div>
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Revenue Intelligence</h1>
        <p className="text-signal-muted text-sm mt-1">
          Channel decomposition · margin bridge · quarterly forecast
        </p>
      </div>

      {/* ── Prescriptive banner ───────────────────────────────────────── */}
      <InsightBanner
        title="Margin compression driven by channel mix shift and IPPI pressure"
        message="Volume growth in Direct and Online channels is being offset by faster growth in low-margin Distributor channel (28.4% GM) and a -1.7pp COGS impact from IPPI rising 12.4% YoY. Five negative-margin SKUs are dragging $112K of gross profit. Recommend price review on SKU-Group B and renegotiation of top 3 distributor agreements before Q4."
        signal="amber"
        updated={new Date().toISOString()}
      />

      {/* ── KPI row ───────────────────────────────────────────────────── */}
      <SectionTitle>Revenue Snapshot</SectionTitle>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="LTM Revenue"
          value={`$${totalRevLTM.toFixed(1)}M`}
          delta="+6.1% vs prior year"
          signal="green"
          caption="9-month trailing · all channels"
        />
        <KPICard
          label="Avg Monthly Revenue"
          value={`$${avgMonthly}M`}
          delta="Q3 trending -4% vs Q2"
          signal="amber"
          caption="Simple monthly average"
        />
        <KPICard
          label="Top SKU Contribution"
          value={`$${topSKUMargin}K`}
          delta="8 SKUs · top 20%"
          signal="green"
          caption="Gross margin $K from top performers"
        />
        <KPICard
          label="Negative-Margin SKU Drag"
          value={`-$${negSKUDrag}K`}
          delta="5 SKUs · SKU-Group B"
          signal="red"
          caption="Gross profit lost to loss-making SKUs"
        />
      </div>

      {/* ── Channel revenue + region filter ───────────────────────────── */}
      <SectionTitle>Revenue by Channel</SectionTitle>
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
          <div>
            <p className="text-white text-sm font-medium">Monthly Revenue by Channel</p>
            <p className="text-signal-muted text-xs mt-0.5">Stacked $M CAD · filter by region</p>
          </div>
          {/* Region filter pills */}
          <div className="flex flex-wrap gap-2">
            {REGIONS.map((r) => (
              <button
                key={r}
                onClick={() => setRegion(r)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                  region === r
                    ? "border-signal-blue bg-signal-blue/10 text-signal-blue"
                    : "border-navy-border text-signal-muted hover:border-signal-blue/40"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={filteredChannel} margin={chartMargin} barCategoryGap="28%">
            <CartesianGrid stroke={C.grid} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" {...axisProps} />
            <YAxis {...axisProps} tickFormatter={(v) => `$${v}M`} />
            <Tooltip content={<ChannelTooltip />} cursor={{ fill: C.grid, opacity: 0.3 }} />
            <Bar dataKey="Direct"      stackId="a" fill={C.blue}   radius={[0, 0, 0, 0]} />
            <Bar dataKey="Distributor" stackId="a" fill={C.amber}  radius={[0, 0, 0, 0]} />
            <Bar dataKey="Online"      stackId="a" fill={C.green}  radius={[0, 0, 0, 0]} />
            <Bar dataKey="Partner"     stackId="a" fill={C.purple} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>

        {/* Channel legend + margin table */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-navy-border">
          {(["Direct", "Distributor", "Online", "Partner"] as const).map((ch, i) => {
            const colours = [C.blue, C.amber, C.green, C.purple];
            const cm = channelMargins[ch];
            return (
              <div key={ch} className="flex flex-col gap-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-sm inline-block" style={{ background: colours[i] }} />
                  <span className="text-xs text-signal-muted">{ch}</span>
                </div>
                <p className="font-mono text-sm text-white">{cm.margin}%</p>
                <p className="text-xs" style={{ color: cm.trend === "down" ? C.red : C.muted }}>
                  {cm.trend === "down" ? "↓ compressing" : "→ stable"} GM
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Margin bridge + quarterly forecast ────────────────────────── */}
      <SectionTitle>Margin & Forecast</SectionTitle>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Margin bridge waterfall */}
        <ChartCard
          title="Gross Margin Bridge — Q2 → Q3"
          subtitle="Contribution of each driver in percentage points (pp)"
        >
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={bridgeComputed}
              margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
              barCategoryGap="20%"
            >
              <CartesianGrid stroke={C.grid} strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="label"
                {...axisProps}
                tick={{ fill: C.muted, fontSize: 10 }}
                interval={0}
                angle={-20}
                textAnchor="end"
                height={48}
              />
              <YAxis
                domain={[32, 38]}
                {...axisProps}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip content={<BridgeTooltip />} cursor={{ fill: C.grid, opacity: 0.3 }} />

              {/* Invisible base bar (creates the floating effect) */}
              <Bar dataKey="floatBase" stackId="bridge" fill="transparent" legendType="none" />

              {/* Visible bar on top */}
              <Bar dataKey="barValue" stackId="bridge" radius={[4, 4, 0, 0]} legendType="none">
                {bridgeComputed.map((entry, i) => (
                  <Cell key={`bridge-${i}`} fill={entry.colour} fillOpacity={entry.isAnchor ? 0.85 : 0.9} />
                ))}
                <LabelList
                dataKey="displayLabel"
                position="top"
                style={{ fill: C.text, fontSize: 10 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>

          {/* Bridge legend */}
          <div className="flex gap-4 mt-2 text-xs text-signal-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm" style={{ background: C.green }} />
              Margin gain
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm" style={{ background: C.red }} />
              Margin drag
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm" style={{ background: C.blue }} />
              Anchor
            </span>
          </div>
        </ChartCard>

        {/* Quarterly revenue forecast */}
        <ChartCard
          title="Quarterly Revenue — Actual vs XGBoost Forecast"
          subtitle="$M CAD · Q4 2025 onward = P10/P50/P90 forecast"
        >
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={quarterlyData} margin={chartMargin}>
              <defs>
                <linearGradient id="qBand" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={C.blue} stopOpacity={0.18} />
                  <stop offset="100%" stopColor={C.blue} stopOpacity={0.04} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={C.grid} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="quarter" {...axisProps} tick={{ fill: C.muted, fontSize: 10 }} />
              <YAxis domain={[3.4, 5.4]} {...axisProps} tickFormatter={(v) => `$${v}M`} />
              <Tooltip content={<QuarterTooltip />} />

              <ReferenceLine
                x="Q4 '25"
                stroke={C.muted}
                strokeDasharray="4 3"
                label={{ value: "Forecast →", position: "top", fill: C.muted, fontSize: 10 }}
              />

              {/* P90 top band */}
              <Area
                type="monotone" dataKey="p90"
                stroke="none" fill="url(#qBand)" fillOpacity={1}
                activeDot={false} legendType="none"
              />
              {/* P10 base — bg fill */}
              <Area
                type="monotone" dataKey="p10"
                stroke={C.red} strokeWidth={1.5} strokeDasharray="4 3"
                fill={C.bg} fillOpacity={1}
                dot={false} activeDot={false} legendType="none"
              />
              {/* P50 line */}
              <Line
                type="monotone" dataKey="p50"
                stroke={C.blue} strokeWidth={2.5}
                dot={false} activeDot={{ r: 4, fill: C.blue, strokeWidth: 0 }}
              />
              {/* Actual bars */}
              <Bar
                dataKey="actual"
                fill={C.green} opacity={0.75}
                radius={[4, 4, 0, 0]}
                barSize={28}
              />
            </ComposedChart>
          </ResponsiveContainer>

          <div className="flex flex-wrap gap-4 mt-3 pt-3 border-t border-navy-border text-xs text-signal-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm opacity-75" style={{ background: C.green }} />
              Actual
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-6 h-[2px]" style={{ background: C.blue }} />
              P50 Forecast
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-6 h-3 rounded opacity-30" style={{ background: C.blue }} />
              P10–P90 Band
            </span>
          </div>
        </ChartCard>
      </div>

      {/* ── SKU Pareto ────────────────────────────────────────────────── */}
      <SectionTitle>SKU Contribution — Top 8 &amp; Bottom 5</SectionTitle>
      <div className="card">
        <p className="text-white text-sm font-medium">Gross Margin by SKU</p>
        <p className="text-signal-muted text-xs mt-0.5 mb-4">
          Gross margin $K contribution · trailing 9 months · red = negative-margin SKUs
        </p>

        <ResponsiveContainer width="100%" height={300}>
          <BarChart
            data={skuData}
            layout="vertical"
            margin={{ top: 4, right: 60, left: 8, bottom: 4 }}
            barCategoryGap="18%"
          >
            <CartesianGrid stroke={C.grid} strokeDasharray="3 3" horizontal={false} />
            <XAxis
              type="number"
              {...axisProps}
              tickFormatter={(v) => `$${v}K`}
              domain={[-60, 340]}
            />
            <YAxis
              type="category"
              dataKey="sku"
              {...axisProps}
              width={64}
              tick={{ fill: C.muted, fontSize: 11 }}
            />
            <Tooltip content={<SKUTooltip />} cursor={{ fill: C.grid, opacity: 0.3 }} />

            <ReferenceLine x={0} stroke={C.muted} strokeWidth={1} />

            <Bar dataKey="margin" radius={[0, 4, 4, 0]} barSize={16}>
              {skuData.map((entry, i) => (
                <Cell
                  key={`sku-${i}`}
                  fill={entry.margin >= 0 ? C.blue : C.red}
                  fillOpacity={entry.margin >= 0 ? 0.85 : 0.80}
                />
              ))}
              <LabelList
                dataKey="margin"
                position="right"
                formatter={(v: any) => `${Number(v) >= 0 ? "+" : ""}$${Number(v)}K`}
                style={{ fill: C.text, fontSize: 10 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {/* Summary row */}
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-navy-border text-xs">
          <div>
            <p className="text-signal-muted">Top 8 SKUs generate</p>
            <p className="font-mono text-white text-base mt-0.5">${topSKUMargin}K</p>
            <p className="text-signal-green">of gross margin</p>
          </div>
          <div>
            <p className="text-signal-muted">Bottom 5 SKUs destroy</p>
            <p className="font-mono text-white text-base mt-0.5">-${negSKUDrag}K</p>
            <p className="text-signal-red">of gross margin</p>
          </div>
          <div>
            <p className="text-signal-muted">Action</p>
            <p className="text-white mt-0.5 leading-snug">
              Review pricing or discontinue SKU-Group B
            </p>
          </div>
        </div>
      </div>

      {/* ── Methodology ───────────────────────────────────────────────── */}
      <p className="text-xs text-signal-muted mt-8 border-t border-navy-border pt-4">
        Revenue decomposition from DuckDB SQL on ERP order data. Margin bridge uses
        Shapley-style attribution across price, volume, mix, and cost drivers.
        Quarterly forecast: XGBoost trained on 8 quarters of ERP data, macro-adjusted
        via BoC rate trajectory and StatCan IPPI. All inference in-browser via ONNX —
        no data leaves your device.
      </p>
    </div>
  );
}