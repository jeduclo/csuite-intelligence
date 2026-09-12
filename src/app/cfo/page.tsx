// src/app/cfo/page.tsx
// CFO Overview — KPI cards + 4 inline charts.
// Charts use static data for now; DuckDB queries wire in later.
"use client";

import {
  AreaChart, Area,
  LineChart, Line,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from "recharts";
import { KPICard }       from "@/components/ui/KPICard";
import { InsightBanner } from "@/components/ui/InsightBanner";

// ─── Colours (match Tailwind theme) ───────────────────────────────────────
const C = {
  blue:   "#1E6FE8",
  green:  "#3DA882",
  amber:  "#F59E0B",
  red:    "#C95555",
  muted:  "#A0B4CC",
  grid:   "#1E3A6E",
  card:   "#1A3560",
  text:   "#C8D8F0",
};

// ─── Static dataset: 13-week cash position ────────────────────────────────
// Represents rolling weekly AP/AR net position
const cashData = [
  { week: "W1",  cash: 7.82 },
  { week: "W2",  cash: 7.65 },
  { week: "W3",  cash: 7.41 },
  { week: "W4",  cash: 7.90 },
  { week: "W5",  cash: 7.55 },
  { week: "W6",  cash: 7.30 },
  { week: "W7",  cash: 7.12 },
  { week: "W8",  cash: 7.44 },
  { week: "W9",  cash: 7.28 },
  { week: "W10", cash: 7.05 },
  { week: "W11", cash: 6.88 },
  { week: "W12", cash: 7.10 },
  { week: "W13", cash: 6.97 },
];

// ─── Static dataset: DSCR trend vs covenant floor ─────────────────────────
// Covenant floor = 1.25×. Anything below = breach.
const dscrData = [
  { month: "Jan", dscr: 1.68 },
  { month: "Feb", dscr: 1.61 },
  { month: "Mar", dscr: 1.55 },
  { month: "Apr", dscr: 1.47 },
  { month: "May", dscr: 1.42 },
  { month: "Jun", dscr: 1.38 },
  { month: "Jul", dscr: 1.31 },
  { month: "Aug", dscr: 1.26 },
  { month: "Sep", dscr: 1.18 }, // ← current (below floor)
];

// ─── Static dataset: Monthly revenue actual vs XGBoost forecast ───────────
const revenueData = [
  { month: "Jan", actual: 1.21, forecast: 1.19 },
  { month: "Feb", actual: 1.08, forecast: 1.12 },
  { month: "Mar", actual: 1.35, forecast: 1.30 },
  { month: "Apr", actual: 1.18, forecast: 1.22 },
  { month: "May", actual: 1.29, forecast: 1.25 },
  { month: "Jun", actual: 1.41, forecast: 1.38 },
  { month: "Jul", actual: 1.33, forecast: 1.35 },
  { month: "Aug", actual: 1.22, forecast: 1.28 },
  { month: "Sep", actual: null, forecast: 1.06 }, // ← forecast only
];

// ─── Static dataset: Margin compression vs IPPI pressure ──────────────────
// Shows gross margin being squeezed as input prices (IPPI) rise
const marginData = [
  { month: "Jan", margin: 36.1, ippi: 2.1 },
  { month: "Feb", margin: 35.8, ippi: 2.4 },
  { month: "Mar", margin: 35.5, ippi: 3.2 },
  { month: "Apr", margin: 35.2, ippi: 4.8 },
  { month: "May", margin: 34.9, ippi: 6.1 },
  { month: "Jun", margin: 34.7, ippi: 7.4 },
  { month: "Jul", margin: 34.5, ippi: 9.2 },
  { month: "Aug", margin: 34.3, ippi: 11.2 },
  { month: "Sep", margin: 34.2, ippi: 12.4 },
];

// ─── Shared chart layout props ─────────────────────────────────────────────
const chartProps = {
  margin: { top: 8, right: 8, left: -20, bottom: 0 },
};

const axisProps = {
  tick:     { fill: C.muted, fontSize: 11 },
  axisLine: { stroke: C.grid },
  tickLine: false,
};

const tooltipStyle = {
  contentStyle: {
    background: C.card,
    border:     `1px solid ${C.grid}`,
    borderRadius: "8px",
    color:      C.text,
    fontSize:   12,
  },
  cursor: { stroke: C.muted, strokeWidth: 1 },
};

// ─── Reusable section title ────────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-medium text-signal-muted uppercase tracking-widest mb-3 mt-6">
      {children}
    </h2>
  );
}

// ─── Chart card wrapper ────────────────────────────────────────────────────
// Consistent container for every chart on the page
function ChartCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="card">
      <p className="text-white text-sm font-medium">{title}</p>
      {subtitle && (
        <p className="text-signal-muted text-xs mt-0.5 mb-3">{subtitle}</p>
      )}
      {children}
    </div>
  );
}

// ─── Custom tooltip formatters ─────────────────────────────────────────────
function CashTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={tooltipStyle.contentStyle} className="px-3 py-2">
      <p className="text-signal-muted text-xs">{label}</p>
      <p className="text-signal-blue font-mono font-medium">
        ${payload[0]?.value?.toFixed(2)}M
      </p>
    </div>
  );
}

function DSCRTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value;
  return (
    <div style={tooltipStyle.contentStyle} className="px-3 py-2">
      <p className="text-signal-muted text-xs">{label}</p>
      <p
        className="font-mono font-medium"
        style={{ color: val < 1.25 ? C.red : C.green }}
      >
        {val?.toFixed(2)}×{val < 1.25 ? " ⚠ below floor" : ""}
      </p>
    </div>
  );
}

// ─── Page component ────────────────────────────────────────────────────────
export default function CFOOverviewPage() {
  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">CFO Overview</h1>
        <p className="text-signal-muted text-sm mt-1">
          What your ERP cannot tell you — in under 60 seconds.
        </p>
      </div>

      {/* Prescriptive action — always first */}
      <InsightBanner
        title="DSCR is 0.07× above covenant floor"
        message="At current burn rate, covenant breach risk in 6 weeks. Recommend reviewing discretionary capex and accelerating Q3 AR collections before next lender review."
        signal="red"
        updated={new Date().toISOString()}
      />

      {/* ── Section 1: KPI cards ──────────────────────────────────────── */}
      <SectionTitle>Signal Summary</SectionTitle>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <KPICard
          label="Cash Position (Week 13)"
          value="$6.97M"
          delta="-$420K vs last week"
          signal="amber"
          caption="13-week rolling AP/AR net. Updated weekly."
        />
        <KPICard
          label="DSCR vs Covenant Floor"
          value="1.18×"
          delta="Floor: 1.25×"
          signal="red"
          caption="Breach risk in 6 weeks at current burn."
        />
        <KPICard
          label="Revenue Forecast P50 (Q3)"
          value="$4.2M"
          delta="+3.1% vs prior Q"
          signal="green"
          caption="XGBoost P50. P10: $3.8M | P90: $4.7M"
        />
        <KPICard
          label="60-Day Customer Default Risk"
          value="3 accounts"
          delta="$1.1M at risk"
          signal="red"
          caption="XGBoost on DSO trend + concentration."
        />
        <KPICard
          label="Gross Margin (Trailing 3M)"
          value="34.2%"
          delta="-1.8pp vs prior Q"
          signal="amber"
          caption="Compression driven by SKU-Group B."
        />
        <KPICard
          label="Macro Cycle Phase"
          value="Mid-Cycle"
          delta="BoC @ 2.25%"
          signal="blue"
          caption="Yield spread + CPI + policy rate."
        />
      </div>

      {/* ── Section 2: Cash + DSCR charts (side by side on desktop) ───── */}
      <SectionTitle>Liquidity & Covenant Health</SectionTitle>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Cash position 13-week trend */}
        <ChartCard
          title="Cash Position — 13 Weeks"
          subtitle="Rolling AP/AR net · $M CAD"
        >
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={cashData} {...chartProps}>
              <defs>
                {/* Gradient fill: blue fading to transparent */}
                <linearGradient id="cashGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={C.blue}  stopOpacity={0.25} />
                  <stop offset="95%" stopColor={C.blue}  stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={C.grid} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="week" {...axisProps} />
              <YAxis domain={[6.5, 8.2]} {...axisProps} tickFormatter={(v) => `$${v}M`} />
              <Tooltip content={<CashTooltip />} />
              <Area
                type="monotone"
                dataKey="cash"
                stroke={C.blue}
                strokeWidth={2}
                fill="url(#cashGrad)"
                dot={false}
                activeDot={{ r: 4, fill: C.blue }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* DSCR trend vs covenant floor */}
        <ChartCard
          title="DSCR Trend vs Covenant Floor"
          subtitle="Debt Service Coverage Ratio · floor = 1.25×"
        >
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={dscrData} {...chartProps}>
              <defs>
                {/* Red danger zone below covenant floor */}
                <linearGradient id="dangerZone" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"  stopColor={C.red} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={C.red} stopOpacity={0.03} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={C.grid} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" {...axisProps} />
              <YAxis domain={[1.0, 1.8]} {...axisProps} tickFormatter={(v) => `${v}×`} />
              <Tooltip content={<DSCRTooltip />} />
              {/* Covenant floor reference line */}
              <ReferenceLine
                y={1.25}
                stroke={C.red}
                strokeDasharray="5 3"
                strokeWidth={1.5}
                label={{
                  value: "Floor 1.25×",
                  position: "insideTopRight",
                  fill: C.red,
                  fontSize: 11,
                }}
              />
              <Line
                type="monotone"
                dataKey="dscr"
                stroke={C.amber}
                strokeWidth={2.5}
                dot={(props: any) => {
                  // Colour dots red when below floor
                  const { cx, cy, payload } = props;
                  const colour = payload.dscr < 1.25 ? C.red : C.amber;
                  return (
                    <circle
                      key={`dot-${payload.month}`}
                      cx={cx} cy={cy} r={4}
                      fill={colour} stroke="none"
                    />
                  );
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Section 3: Revenue + Margin charts ────────────────────────── */}
      <SectionTitle>Revenue & Margin Intelligence</SectionTitle>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Monthly revenue: actual vs forecast */}
        <ChartCard
          title="Revenue — Actual vs Forecast"
          subtitle="Monthly $M CAD · Sep onward = XGBoost P50"
        >
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={revenueData} {...chartProps} barGap={4}>
              <CartesianGrid stroke={C.grid} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" {...axisProps} />
              <YAxis
                domain={[0.8, 1.6]}
                {...axisProps}
                tickFormatter={(v) => `$${v}M`}
              />
              <Tooltip
                contentStyle={tooltipStyle.contentStyle}
                cursor={{ fill: C.grid, opacity: 0.4 }}
                formatter={(val: any) => [`$${Number(val).toFixed(2)}M`]}
              />
              {/* Actual revenue bars */}
              <Bar
                dataKey="actual"
                fill={C.blue}
                radius={[4, 4, 0, 0]}
                opacity={0.85}
              />
              {/* Forecast bars (dashed outline style via lower opacity) */}
              <Bar
                dataKey="forecast"
                fill={C.amber}
                radius={[4, 4, 0, 0]}
                opacity={0.55}
              />
            </BarChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div className="flex gap-4 mt-2 text-xs text-signal-muted">
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-sm" style={{ background: C.blue }} />
              Actual
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-3 h-3 rounded-sm opacity-55" style={{ background: C.amber }} />
              Forecast
            </span>
          </div>
        </ChartCard>

        {/* Margin compression vs IPPI */}
        <ChartCard
          title="Margin Compression vs Input Cost Pressure"
          subtitle="Gross margin % (left) · IPPI YoY % (right)"
        >
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={marginData} {...chartProps}>
              <CartesianGrid stroke={C.grid} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" {...axisProps} />
              {/* Left axis: gross margin */}
              <YAxis
                yAxisId="margin"
                orientation="left"
                domain={[33, 37.5]}
                {...axisProps}
                tickFormatter={(v) => `${v}%`}
              />
              {/* Right axis: IPPI YoY */}
              <YAxis
                yAxisId="ippi"
                orientation="right"
                domain={[0, 16]}
                tick={{ fill: C.red, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                contentStyle={tooltipStyle.contentStyle}
                formatter={(val: number, name: string) => [
                  `${val?.toFixed(1)}%`,
                  name === "margin" ? "Gross Margin" : "IPPI YoY",
                ]}
              />
              <Line
                yAxisId="margin"
                type="monotone"
                dataKey="margin"
                stroke={C.green}
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 4, fill: C.green }}
              />
              <Line
                yAxisId="ippi"
                type="monotone"
                dataKey="ippi"
                stroke={C.red}
                strokeWidth={2}
                strokeDasharray="4 3"
                dot={false}
                activeDot={{ r: 4, fill: C.red }}
              />
            </LineChart>
          </ResponsiveContainer>
          {/* Legend */}
          <div className="flex gap-4 mt-2 text-xs text-signal-muted">
            <span className="flex items-center gap-2">
              <span className="inline-block w-5 h-0.5" style={{ background: C.green }} />
              Gross Margin
            </span>
            <span className="flex items-center gap-2">
              <span className="inline-block w-5 h-0.5" style={{ background: C.red, borderTop: "2px dashed" }} />
              IPPI Pressure
            </span>
          </div>
        </ChartCard>
      </div>

      {/* Methodology footnote */}
      <p className="text-xs text-signal-muted mt-8 border-t border-navy-border pt-4">
        Forecasts use XGBoost trained on 8 quarters of ERP transactional data combined
        with BoC rate trajectory and StatCan CPI/IPPI. All models run in-browser via
        ONNX Runtime Web — no data leaves your device.
      </p>
    </div>
  );
}