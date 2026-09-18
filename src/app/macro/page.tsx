// src/app/macro/page.tsx
"use client";

import { useState } from "react";
import {
  LineChart, Line,
  AreaChart, Area,
  ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell,
} from "recharts";
import { KPICard }       from "@/components/ui/KPICard";
import { InsightBanner } from "@/components/ui/InsightBanner";
import { useMacroData }  from "@/lib/hooks/useMacroData";
import { LoadingShell }  from "@/components/ui/LoadingShell";

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

// ─── Static data that doesn't come from JSON ───────────────────────────────

// 5-pillar scores — hand-calibrated from real macro data, updated weekly
const pillars = [
  { name: "Economy",   score:  0.5,  detail: "GDP +3.3% ann. · Unemployment 6.4%"    },
  { name: "Fiscal",    score:  1.0,  detail: "Deficit −2.1% GDP · Stimulus posture"  },
  { name: "Monetary",  score:  0.5,  detail: "BoC @ 2.25% · Real rate −0.78%"        },
  { name: "Cycle",     score:  0.5,  detail: "Mid-cycle · OECD CLI 101.8"            },
  { name: "Open Econ", score: -1.0,  detail: "Tariff exposure $71.5B · USD/CAD 1.39" },
];

const compositeScore = +(pillars.reduce((s, p) => s + p.score, 0) / pillars.length).toFixed(2);
const compositeLabel =
  compositeScore >  0.5 ? "Positive" :
  compositeScore < -0.5 ? "Negative" : "Neutral";
const compositeSignal =
  compositeScore >  0.5 ? "green" as const :
  compositeScore < -0.5 ? "red"   as const : "amber" as const;

// ─── Helpers ──────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-medium text-signal-muted uppercase tracking-widest mb-3 mt-8">
      {children}
    </h2>
  );
}

function ChartCard({
  title, subtitle, children, className = "",
}: {
  title: string; subtitle?: string; children: React.ReactNode; className?: string;
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

// ─── 5-Pillar Radar (custom SVG) ──────────────────────────────────────────
function MacroRadar({ data }: { data: typeof pillars }) {
  const cx = 130, cy = 130, r = 90, n = data.length;
  const toRadius = (score: number) => ((score + 2) / 4) * r;
  const points = data.map((p, i) => {
    const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
    const rad   = toRadius(p.score);
    return {
      x:  cx + rad * Math.cos(angle),
      y:  cy + rad * Math.sin(angle),
      lx: cx + (r + 24) * Math.cos(angle),
      ly: cy + (r + 24) * Math.sin(angle),
      name: p.name, score: p.score,
    };
  });
  const rings = [-2, -1, 0, 1, 2].map(toRadius);
  const polyPath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ") + " Z";

  return (
    <svg viewBox="0 0 260 260" className="w-full max-w-[260px] mx-auto">
      {rings.map((rad, i) => (
        <polygon key={i}
          points={data.map((_, j) => {
            const a = (j / n) * 2 * Math.PI - Math.PI / 2;
            return `${cx + rad * Math.cos(a)},${cy + rad * Math.sin(a)}`;
          }).join(" ")}
          fill="none"
          stroke={i === 2 ? C.muted : C.grid}
          strokeWidth={i === 2 ? 1.5 : 0.8}
          strokeDasharray={i === 2 ? "4 2" : undefined}
        />
      ))}
      {points.map((p, i) => (
        <line key={i} x1={cx} y1={cy}
          x2={cx + r * Math.cos((i / n) * 2 * Math.PI - Math.PI / 2)}
          y2={cy + r * Math.sin((i / n) * 2 * Math.PI - Math.PI / 2)}
          stroke={C.grid} strokeWidth={0.8}
        />
      ))}
      <path d={polyPath} fill={`${C.blue}22`} stroke={C.blue} strokeWidth={2} />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={4}
          fill={p.score >= 0 ? C.blue : C.red}
          stroke={C.bg} strokeWidth={1.5}
        />
      ))}
      {points.map((p, i) => (
        <text key={i} x={p.lx} y={p.ly}
          textAnchor="middle" dominantBaseline="middle"
          fontSize={10} fill={C.text}
        >{p.name}</text>
      ))}
      <text x={cx} y={cy - 8}  textAnchor="middle" fontSize={9} fill={C.muted}>Macro</text>
      <text x={cx} y={cy + 6}  textAnchor="middle" fontSize={9} fill={C.muted}>Score</text>
    </svg>
  );
}

// ─── Sector row ────────────────────────────────────────────────────────────
function SectorRow({ d }: { d: { sector: string; ratio: number; trend: string; action: string } }) {
  const barWidth = Math.min(120, Math.abs((d.ratio - 1) * 300));
  const isOver   = d.ratio >= 1;
  const colour   = d.action === "Overweight" ? C.green : d.action === "Underweight" ? C.red : C.muted;

  return (
    <div className="flex items-center gap-3 py-2.5 border-b border-navy-border last:border-0">
      <p className="text-sm text-white w-40 shrink-0">{d.sector}</p>
      <div className="flex-1 flex items-center gap-1">
        <div className="flex-1 flex justify-end">
          {!isOver && (
            <div className="h-3 rounded-l-full opacity-80"
              style={{ width: `${barWidth}px`, background: C.red }} />
          )}
        </div>
        <div className="w-0.5 h-4 bg-signal-muted opacity-40 shrink-0" />
        <div className="flex-1">
          {isOver && (
            <div className="h-3 rounded-r-full opacity-80"
              style={{ width: `${barWidth}px`, background: C.green }} />
          )}
        </div>
      </div>
      <p className="font-mono text-sm w-12 text-right" style={{ color: colour }}>
        {d.ratio.toFixed(2)}×
      </p>
      <span className="text-xs font-medium px-2 py-0.5 rounded-full w-24 text-center"
        style={{ color: colour, background: `${colour}15`, border: `1px solid ${colour}30` }}>
        {d.action}
      </span>
    </div>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────
export default function MacroPage() {
  const [rateScenario, setRateScenario] = useState<"hold" | "cut">("hold");

  // All real data from committed JSON files
  const {
    loading, error,
    bocChart, yieldCurve, spreadTrend, inflation, sectors,
    latestRate, latestSpread, latestCPI, latestIPPI,
    cyclePhase,
  } = useMacroData();

  // Loading state
  if (loading) return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Macro Intelligence</h1>
        <p className="text-signal-muted text-sm mt-1">Loading live data...</p>
      </div>
      <LoadingShell rows={4} />
    </div>
  );

  // Error state
  if (error) return (
    <div className="card border-l-4 border-signal-red">
      <p className="text-signal-red font-medium">Failed to load macro data</p>
      <p className="text-signal-muted text-xs mt-1">{error}</p>
      <p className="text-signal-muted text-xs mt-3">
        Make sure you have run the Colab notebook and moved the JSON files to{" "}
        <code className="text-signal-blue">public/data/macro/</code>
      </p>
    </div>
  );

  // ── Derived values — computed once from hook output ──────────────────
  const spreadStatus = latestSpread < 0 ? "Inverted" : latestSpread < 0.3 ? "Flat" : "Normal";
  const spreadSignal = (latestSpread < 0 ? "red" : latestSpread < 0.3 ? "amber" : "green") as "red" | "amber" | "green";
  const ippiGap      = +(latestIPPI - latestCPI).toFixed(1);

  return (
    <div>
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">Macro Intelligence</h1>
        <p className="text-signal-muted text-sm mt-1">
          BoC policy · yield curve · CPI/IPPI · TSX sector rotation · macro cycle
        </p>
      </div>

      {/* ── Banner ────────────────────────────────────────────────────── */}
      <InsightBanner
        title={`${cyclePhase} — ${spreadStatus} yield curve — selective risk-on`}
        message={`Yield curve is ${spreadStatus.toLowerCase()} at +${latestSpread.toFixed(2)}% (10Y−2Y). BoC held at ${latestRate.toFixed(2)}% — neutral stance. IPPI running ${ippiGap}pp above CPI, creating a sustained margin squeeze. Tariff exposure of $71.5B remains the primary macro risk. Positioning: overweight Financials and Energy; underweight Staples and High-Yield. Lock in fixed-rate debt before next BoC decision.`}
        signal="amber"
        updated={new Date().toISOString()}
      />

      {/* ── KPI row ───────────────────────────────────────────────────── */}
      <SectionTitle>Macro Signal Dashboard</SectionTitle>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="BoC Overnight Rate"
          value={`${latestRate.toFixed(2)}%`}
          delta="Held · neutral band"
          signal="blue"
          caption="Neutral zone: 2.25–2.75%"
        />
        <KPICard
          label="10Y−2Y Yield Spread"
          value={`+${latestSpread.toFixed(2)}%`}
          delta={spreadStatus}
          signal={spreadSignal}
          caption="Positive = normal · negative = inversion"
        />
        <KPICard
          label="IPPI vs CPI Gap"
          value={`+${ippiGap}pp`}
          delta="Input costs outpacing prices"
          signal="red"
          caption={`IPPI ${latestIPPI.toFixed(1)}% YoY vs CPI ${latestCPI.toFixed(1)}% YoY`}
        />
        <KPICard
          label="Macro Composite"
          value={compositeLabel}
          delta={`Score: ${compositeScore} / 2.0`}
          signal={compositeSignal}
          caption="5-pillar weighted composite"
        />
      </div>

      {/* ── BoC rate trajectory ───────────────────────────────────────── */}
      <SectionTitle>BoC Rate Trajectory</SectionTitle>
      <ChartCard
        title="Bank of Canada Overnight Rate — Historical + Forward Scenarios"
        subtitle="Actual (solid amber) · Hold scenario (blue dashed) · Cut scenario (green dashed)"
      >
        <div className="flex gap-2 mb-4">
          {(["hold", "cut"] as const).map((s) => (
            <button key={s} onClick={() => setRateScenario(s)}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                rateScenario === s
                  ? s === "hold"
                    ? "border-signal-blue  bg-signal-blue/10  text-signal-blue"
                    : "border-signal-green bg-signal-green/10 text-signal-green"
                  : "border-navy-border text-signal-muted"
              }`}
            >
              {s === "hold" ? "Hold at current" : "Cut scenario"}
            </button>
          ))}
        </div>

        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={bocChart} margin={chartMargin}>
            <defs>
              <linearGradient id="rateGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={C.blue} stopOpacity={0.15} />
                <stop offset="100%" stopColor={C.blue} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={C.grid} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="date" {...axisProps} tick={{ fill: C.muted, fontSize: 10 }} interval={2} />
            <YAxis domain={[1.0, 3.5]} {...axisProps} tickFormatter={(v) => `${v}%`} />
            <Tooltip
              contentStyle={tooltipBase}
              formatter={(v: any, name: string) => [
                `${Number(v).toFixed(2)}%`,
                name === "actual" ? "Actual" : name === "hold" ? "Hold" : "Cut",
              ]}
            />
            <ReferenceLine y={2.25} stroke={C.green} strokeDasharray="3 2" strokeWidth={1}
              label={{ value: "Neutral floor", position: "insideTopRight", fill: C.green, fontSize: 10 }} />
            <ReferenceLine y={2.75} stroke={C.green} strokeDasharray="3 2" strokeWidth={1} />
            <Area type="stepAfter" dataKey="hold"
              stroke={C.blue} strokeWidth={2} strokeDasharray="6 3"
              fill="url(#rateGrad)" fillOpacity={rateScenario === "hold" ? 1 : 0.2}
              dot={false} activeDot={{ r: 4, fill: C.blue, strokeWidth: 0 }}
            />
            <Area type="stepAfter" dataKey="cut"
              stroke={C.green} strokeWidth={2} strokeDasharray="6 3"
              fill="transparent"
              dot={false} activeDot={{ r: 4, fill: C.green, strokeWidth: 0 }}
            />
            <Line type="stepAfter" dataKey="actual"
              stroke={C.amber} strokeWidth={2.5}
              dot={{ r: 3, fill: C.amber, strokeWidth: 0 }}
              connectNulls={false}
            />
          </ComposedChart>
        </ResponsiveContainer>

        <div className="flex gap-5 mt-3 pt-3 border-t border-navy-border text-xs text-signal-muted">
          <span className="flex items-center gap-2">
            <span className="w-6 h-[2px]" style={{ background: C.amber }} />Actual
          </span>
          <span className="flex items-center gap-2">
            <span className="w-6 h-[2px]" style={{ background: C.blue }} />Hold
          </span>
          <span className="flex items-center gap-2">
            <span className="w-6 h-[2px]" style={{ background: C.green }} />Cut
          </span>
        </div>
      </ChartCard>

      {/* ── Yield curve + spread ──────────────────────────────────────── */}
      <SectionTitle>Yield Curve Analysis</SectionTitle>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <ChartCard title="GoC Yield Curve — Now vs 6 Months Ago"
          subtitle="% yield by tenor · steepening = positive signal">
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={yieldCurve} margin={chartMargin}>
              <CartesianGrid stroke={C.grid} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="tenor" {...axisProps} />
              <YAxis domain={[1.5, 5.5]} {...axisProps} tickFormatter={(v) => `${v}%`} />
              <Tooltip contentStyle={tooltipBase}
                formatter={(v: any, name: string) => [
                  `${Number(v).toFixed(2)}%`,
                  name === "current" ? "Current" : "6M Ago",
                ]}
              />
              <Line type="monotone" dataKey="sixMonthsAgo"
                stroke={C.muted} strokeWidth={1.5} strokeDasharray="4 3"
                dot={{ r: 3, fill: C.muted, strokeWidth: 0 }}
              />
              <Line type="monotone" dataKey="current"
                stroke={C.blue} strokeWidth={2.5}
                dot={{ r: 4, fill: C.blue, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex gap-5 mt-2 text-xs text-signal-muted">
            <span className="flex items-center gap-2">
              <span className="w-6 h-[2px]" style={{ background: C.blue }} />Current
            </span>
            <span className="flex items-center gap-2">
              <span className="w-6 h-[2px]" style={{ background: C.muted }} />6M ago
            </span>
          </div>
        </ChartCard>

        <ChartCard title="10Y − 2Y Spread Trend"
          subtitle="Positive = normal curve · negative = inversion (recession signal)">
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={spreadTrend} margin={chartMargin}>
              <defs>
                <linearGradient id="spreadPos" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={C.green} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={C.green} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={C.grid} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" {...axisProps} tick={{ fill: C.muted, fontSize: 10 }} interval={1} />
              <YAxis {...axisProps} tickFormatter={(v) => `${Number(v) >= 0 ? "+" : ""}${Number(v).toFixed(2)}%`} />
              <Tooltip contentStyle={tooltipBase}
                formatter={(v: any) => [
                  `${Number(v) >= 0 ? "+" : ""}${Number(v).toFixed(3)}%`,
                  "10Y−2Y Spread",
                ]}
              />
              <ReferenceLine y={0} stroke={C.red} strokeDasharray="4 2" strokeWidth={1.5}
                label={{ value: "Inversion", position: "insideTopRight", fill: C.red, fontSize: 10 }}
              />
              <Area type="monotone" dataKey="spread"
                stroke={C.green} strokeWidth={2}
                fill="url(#spreadPos)"
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  return (
                    <circle key={payload.month} cx={cx} cy={cy} r={3}
                      fill={payload.spread >= 0 ? C.green : C.red}
                      strokeWidth={0}
                    />
                  );
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── CPI vs IPPI ───────────────────────────────────────────────── */}
      <SectionTitle>Inflation — CPI vs IPPI Margin Squeeze</SectionTitle>
      <ChartCard
        title="CPI (Consumer) vs IPPI (Industrial Input Costs) — YoY %"
        subtitle="When IPPI > CPI: input costs rising faster than sellable prices → gross margin compression"
      >
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={inflation} margin={chartMargin}>
            <defs>
              <linearGradient id="ippiGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"   stopColor={C.red} stopOpacity={0.15} />
                <stop offset="100%" stopColor={C.red} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={C.grid} strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="month" {...axisProps} tick={{ fill: C.muted, fontSize: 10 }} interval={1} />
            <YAxis {...axisProps} tickFormatter={(v) => `${v}%`} />
            <Tooltip contentStyle={tooltipBase}
              formatter={(v: any, name: string) => [
                `${Number(v).toFixed(2)}%`,
                name === "cpi" ? "CPI (headline)" : "IPPI (input costs)",
              ]}
            />
            <ReferenceLine y={2} stroke={C.green} strokeDasharray="3 2"
              label={{ value: "BoC 2% target", position: "insideTopRight", fill: C.green, fontSize: 10 }}
            />
            <Area type="monotone" dataKey="ippi"
              stroke={C.red} strokeWidth={2}
              fill="url(#ippiGrad)"
              dot={false} activeDot={{ r: 4, fill: C.red, strokeWidth: 0 }}
            />
            <Line type="monotone" dataKey="cpi"
              stroke={C.amber} strokeWidth={2.5}
              dot={{ r: 3, fill: C.amber, strokeWidth: 0 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
        <div className="flex gap-5 mt-3 pt-3 border-t border-navy-border text-xs text-signal-muted">
          <span className="flex items-center gap-2">
            <span className="w-6 h-[2px]" style={{ background: C.amber }} />CPI (output)
          </span>
          <span className="flex items-center gap-2">
            <span className="w-6 h-3 rounded opacity-30" style={{ background: C.red }} />IPPI (input costs)
          </span>
          <span className="ml-auto font-medium" style={{ color: C.red }}>
            Gap: +{ippiGap}pp — margin headwind
          </span>
        </div>
      </ChartCard>

      {/* ── Sector rotation + radar ────────────────────────────────────── */}
      <SectionTitle>TSX Sector Rotation &amp; Macro Composite</SectionTitle>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        <div className="card">
          <p className="text-white text-sm font-medium">TSX Sector Relative Strength vs XIU</p>
          <p className="text-signal-muted text-xs mt-0.5 mb-5">
            Ratio to broad market benchmark · &gt;1.0 = outperforming · live from Yahoo Finance
          </p>
          <div>
            <div className="flex items-center gap-3 pb-2 border-b border-navy-border mb-1">
              <p className="text-xs text-signal-muted w-40">Sector</p>
              <p className="text-xs text-signal-muted flex-1 text-center">← Under · Over →</p>
              <p className="text-xs text-signal-muted w-12 text-right">Ratio</p>
              <p className="text-xs text-signal-muted w-24 text-center">Stance</p>
            </div>
            {sectors.map((d) => <SectorRow key={d.sector} d={d} />)}
          </div>
          <p className="text-xs text-signal-muted mt-4 pt-3 border-t border-navy-border">
            Mid-cycle + positive yield spread favours cyclicals. Tariff risk limits broad conviction.
          </p>
        </div>

        <div className="card">
          <p className="text-white text-sm font-medium">Five-Pillar Macro Composite</p>
          <p className="text-signal-muted text-xs mt-0.5 mb-2">
            Score −2 (contractionary) to +2 (expansionary) · Sep 2026
          </p>
          <MacroRadar data={pillars} />
          <div className="mt-4 space-y-2">
            {pillars.map((p) => (
              <div key={p.name} className="flex items-center gap-3">
                <p className="text-xs text-signal-muted w-20">{p.name}</p>
                <div className="flex-1 h-1.5 rounded-full bg-navy-border relative">
                  <div className="absolute top-0 h-1.5 rounded-full"
                    style={{
                      width:      `${(Math.abs(p.score) / 2) * 50}%`,
                      left:       p.score >= 0 ? "50%" : `${50 - (Math.abs(p.score) / 2) * 50}%`,
                      background: p.score >= 0 ? C.green : C.red,
                    }}
                  />
                  <div className="absolute top-0 left-1/2 w-0.5 h-1.5 bg-signal-muted opacity-60" />
                </div>
                <p className="font-mono text-xs w-12 text-right"
                  style={{ color: p.score >= 0 ? C.green : C.red }}>
                  {p.score >= 0 ? "+" : ""}{p.score}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Board-ready action summary ────────────────────────────────── */}
      <SectionTitle>Board-Ready Action Summary</SectionTitle>
      <div className="card">
        <p className="text-white text-sm font-medium mb-4">
          Plain-Language Capital Allocation Posture — September 2026
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: "💰", title: "Debt Strategy", colour: C.amber,
              action: "Lock in fixed-rate debt now.",
              detail: `BoC is at the neutral floor (${latestRate.toFixed(2)}%). The hold scenario keeps rates here for 2+ quarters. Refinancing floating-rate facilities now reduces debt service volatility.`,
            },
            {
              icon: "📊", title: "Capital Allocation", colour: C.blue,
              action: "Rotate toward cyclicals. Reduce defensive exposure.",
              detail: `Positive yield curve (+${latestSpread.toFixed(2)}%) and mid-cycle OECD CLI (101.8) favour Financials and Energy. Consumer Staples and HY Bond are underperforming — trim exposure.`,
            },
            {
              icon: "⚠️", title: "Primary Risk", colour: C.red,
              action: "Monitor tariff exposure — $71.5B at risk.",
              detail: "Automotive ($40B) and Consumer Goods ($22B) tariff exposure is the dominant macro risk. Escalation would reduce GDP by ~0.8pp and pressure CAD.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-xl p-4 border"
              style={{ borderColor: `${item.colour}30`, background: `${item.colour}08` }}>
              <p className="text-xl mb-2">{item.icon}</p>
              <p className="text-xs text-signal-muted uppercase tracking-wider mb-1">{item.title}</p>
              <p className="text-white text-sm font-semibold mb-2">{item.action}</p>
              <p className="text-signal-muted text-xs leading-relaxed">{item.detail}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Methodology ───────────────────────────────────────────────── */}
      <p className="text-xs text-signal-muted mt-8 border-t border-navy-border pt-4">
        Data: Bank of Canada Valet API (overnight rate, GoC 2Y/10Y yields),
        Statistics Canada WDS (CPI table 18100004, IPPI table 18100265),
        Yahoo Finance via yfinance (TSX sector ETFs). Loaded from{" "}
        <code className="text-signal-blue">public/data/macro/</code> at runtime.
        Refresh by re-running the Colab notebook and committing updated JSON files.
      </p>
    </div>
  );
}