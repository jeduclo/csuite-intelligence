// src/app/cfo/simulator/page.tsx
//
// Answers:
//   1. What happens to margin if we raise prices by 5%?
//   2. What is the revenue impact of increasing marketing spend?
//   3. How does a BoC rate change affect our debt cost?
//
// Architecture:
//   - Sliders set intervention values
//   - CATE coefficients (static for now, ONNX worker wires in later)
//     apply causal deltas to XGBoost baseline
//   - All output updates instantly — no backend
"use client";

import { useState, useMemo } from "react";
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
  muted:  "#A0B4CC",
  grid:   "#1E3A6E",
  card:   "#1A3560",
  bg:     "#0A1628",
  text:   "#C8D8F0",
};

const tooltipBase = {
  background:   C.card,
  border:       `1px solid ${C.grid}`,
  borderRadius: "8px",
  color:        C.text,
  fontSize:     12,
  padding:      "8px 12px",
};

const axisProps = {
  tick:     { fill: C.muted, fontSize: 11 },
  axisLine: { stroke: C.grid },
  tickLine: false,
};

// ─── BASELINE VALUES (XGBoost P50 baseline) ────────────────────────────────
const BASELINE = {
  revenue:     4.22,   // $M quarterly
  grossMargin: 34.2,   // %
  ebitda:      1.18,   // $M quarterly
  cashQ:       6.97,   // $M end of quarter
  debtService: 0.38,   // $M quarterly
};

// ─── CATE COEFFICIENTS ─────────────────────────────────────────────────────
// These are the causal treatment effect estimates per unit of intervention.
// In production: DoubleML ONNX worker computes these at inference time.
// Here: pre-estimated static coefficients for demo.
//
// Each coefficient = marginal effect on the outcome per 1 unit of the lever.
// Signs matter: positive = improvement, negative = drag.
const CATE = {
  // Revenue response to price change (% price delta → % revenue delta)
  // Non-linear: price elasticity ≈ -0.6 (inelastic product)
  // +5% price → +5% × (1 - 0.6 × 0.05) ≈ +4.85% revenue
  priceToRevenue: (priceDelta: number) => {
    const elasticity = -0.55;
    return priceDelta * (1 + elasticity * (priceDelta / 100));
  },

  // Margin response to price change (direct pass-through, minus mix erosion)
  // +5% price → +1.8pp gross margin (some volume loss offsets)
  priceToMargin: (priceDelta: number) => priceDelta * 0.36,

  // Revenue response to marketing spend increase
  // Diminishing returns: first 10% very effective, diminishes thereafter
  mktgToRevenue: (mktgDelta: number) => {
    if (mktgDelta <= 0) return mktgDelta * 0.15;
    return Math.sqrt(Math.abs(mktgDelta)) * 0.8 * Math.sign(mktgDelta);
  },

  // Margin response to marketing spend (spend increase = margin drag)
  // $1 of extra spend on $11M revenue base ≈ -0.009pp per % of spend increase
  mktgToMargin: (mktgDelta: number) => mktgDelta * -0.09,

  // Revenue response to headcount change (productivity effect, lagged)
  // -10% headcount → -2.1% revenue (capabilities loss)
  headcountToRevenue: (hcDelta: number) => hcDelta * 0.21,

  // Margin response to headcount change (SG&A lever)
  // -10% headcount → +1.4pp margin (cost reduction)
  headcountToMargin: (hcDelta: number) => hcDelta * -0.14,

  // Debt service cost response to BoC rate change
  // +100bps → +$38K/quarter on floating-rate debt
  rateToDebtService: (rateBps: number) => (rateBps / 100) * 0.019,

  // Cash response to rate change (through debt service)
  rateToCash: (rateBps: number) => -(rateBps / 100) * 0.019 * 4, // annualised
};

// ─── SLIDER CONFIG ────────────────────────────────────────────────────────
interface SliderConfig {
  key:     string;
  label:   string;
  sublabel: string;
  min:     number;
  max:     number;
  step:    number;
  unit:    string;
  default: number;
  colour:  string;
}

const SLIDERS: SliderConfig[] = [
  {
    key:      "price",
    label:    "Price Change",
    sublabel: "Average selling price delta across all SKUs",
    min: -15, max: 15, step: 0.5,
    unit:     "%",
    default:  0,
    colour:   C.blue,
  },
  {
    key:      "mktg",
    label:    "Marketing Spend",
    sublabel: "Change in quarterly marketing budget",
    min: -50, max: 100, step: 5,
    unit:     "%",
    default:  0,
    colour:   C.purple,
  },
  {
    key:      "headcount",
    label:    "Headcount",
    sublabel: "Workforce size change (+ = hire, − = reduce)",
    min: -20, max: 20, step: 1,
    unit:     "%",
    default:  0,
    colour:   C.amber,
  },
  {
    key:      "rate",
    label:    "BoC Rate Shock",
    sublabel: "Basis points change to overnight rate",
    min: -100, max: 300, step: 25,
    unit:     "bps",
    default:  0,
    colour:   C.red,
  },
];

// ─── SLIDER COMPONENT ─────────────────────────────────────────────────────
function Slider({
  config,
  value,
  onChange,
}: {
  config: SliderConfig;
  value: number;
  onChange: (v: number) => void;
}) {
  const pct = ((value - config.min) / (config.max - config.min)) * 100;
  const isNeutral = value === 0;
  const isPositive = value > 0;

  return (
    <div className="card">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-white text-sm font-medium">{config.label}</p>
          <p className="text-signal-muted text-xs mt-0.5">{config.sublabel}</p>
        </div>
        {/* Current value badge */}
        <span
          className="font-mono text-lg font-semibold min-w-[72px] text-right"
          style={{
            color: isNeutral ? C.muted : isPositive ? C.green : C.red,
          }}
        >
          {isPositive ? "+" : ""}{value}{config.unit}
        </span>
      </div>

      {/* Slider track */}
      <div className="relative">
        <input
          type="range"
          min={config.min}
          max={config.max}
          step={config.step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-1.5 appearance-none rounded-full outline-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, ${config.colour} 0%, ${config.colour} ${pct}%, ${C.grid} ${pct}%, ${C.grid} 100%)`,
          }}
        />
        {/* Zero marker */}
        <div
          className="absolute top-0 h-1.5 w-0.5 bg-signal-muted opacity-50"
          style={{ left: `${((0 - config.min) / (config.max - config.min)) * 100}%` }}
        />
      </div>

      {/* Min / Max labels */}
      <div className="flex justify-between mt-1.5 text-xs text-signal-muted">
        <span>{config.min}{config.unit}</span>
        <span
          className="text-xs cursor-pointer hover:text-white transition-colors"
          onClick={() => onChange(0)}
        >
          Reset
        </span>
        <span>{config.max}{config.unit}</span>
      </div>
    </div>
  );
}

// ─── SECTION TITLE ────────────────────────────────────────────────────────
function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-medium text-signal-muted uppercase tracking-widest mb-3 mt-8">
      {children}
    </h2>
  );
}

// ─── PAGE ─────────────────────────────────────────────────────────────────
export default function SimulatorPage() {
  const [price,     setPrice]     = useState(0);
  const [mktg,      setMktg]      = useState(0);
  const [headcount, setHeadcount] = useState(0);
  const [rate,      setRate]      = useState(0);

  // ── Apply CATE deltas to baseline ────────────────────────────────────
  const scenario = useMemo(() => {
    // Revenue deltas (%)
    const revDeltaPct =
      CATE.priceToRevenue(price) +
      CATE.mktgToRevenue(mktg) +
      CATE.headcountToRevenue(headcount);

    // Margin deltas (pp)
    const marginDeltaPp =
      CATE.priceToMargin(price) +
      CATE.mktgToMargin(mktg) +
      CATE.headcountToMargin(headcount);

    // Debt service delta ($M)
    const debtDelta = CATE.rateToDebtService(rate);

    // Cash delta ($M)
    const cashDelta = CATE.rateToCash(rate) + (revDeltaPct / 100) * BASELINE.revenue * 0.3;

    const revenue     = +(BASELINE.revenue     * (1 + revDeltaPct / 100)).toFixed(2);
    const grossMargin = +(BASELINE.grossMargin + marginDeltaPp).toFixed(1);
    const ebitda      = +(revenue * (grossMargin / 100) - BASELINE.debtService - debtDelta).toFixed(2);
    const debtService = +(BASELINE.debtService + debtDelta).toFixed(3);
    const cash        = +(BASELINE.cashQ + cashDelta).toFixed(2);

    return { revenue, grossMargin, ebitda, debtService, cash, revDeltaPct, marginDeltaPp, debtDelta };
  }, [price, mktg, headcount, rate]);

  // ── Waterfall: contribution of each lever ────────────────────────────
  // Shows how each slider contributes to the total revenue delta
  const waterfallData = useMemo(() => {
    const priceRev  = +(CATE.priceToRevenue(price)         / 100 * BASELINE.revenue).toFixed(3);
    const mktgRev   = +(CATE.mktgToRevenue(mktg)           / 100 * BASELINE.revenue).toFixed(3);
    const hcRev     = +(CATE.headcountToRevenue(headcount)  / 100 * BASELINE.revenue).toFixed(3);
    const rateRev   = 0; // rate doesn't directly affect revenue

    let running = BASELINE.revenue;
    const rows = [
      { label: "Baseline",  value: BASELINE.revenue, base: 0,       isAnchor: true  },
      { label: "Price",     value: priceRev,          base: running, isAnchor: false },
      { label: "Marketing", value: mktgRev,           base: running + priceRev, isAnchor: false },
      { label: "Headcount", value: hcRev,             base: running + priceRev + mktgRev, isAnchor: false },
      { label: "Scenario",  value: scenario.revenue,  base: 0,       isAnchor: true  },
    ];

    return rows.map((r) => ({
      ...r,
      floatBase:    r.isAnchor ? 0 : Math.min(r.base, r.base + r.value),
      barValue:     r.isAnchor ? r.value : Math.abs(r.value),
      colour:       r.isAnchor ? C.blue : r.value >= 0 ? C.green : C.red,
      displayLabel: r.isAnchor
        ? `$${r.value.toFixed(2)}M`
        : `${r.value >= 0 ? "+" : ""}$${r.value.toFixed(3)}M`,
    }));
  }, [price, mktg, headcount, rate, scenario]);

  // ── Tornado: sensitivity of each lever at ±10% / ±100bps ────────────
  const tornadoData = [
    {
      lever:    "Price (±10%)",
      positive: +(CATE.priceToRevenue(10)  / 100 * BASELINE.revenue).toFixed(2),
      negative: +(CATE.priceToRevenue(-10) / 100 * BASELINE.revenue).toFixed(2),
    },
    {
      lever:    "Headcount (±10%)",
      positive: +(CATE.headcountToRevenue(10)  / 100 * BASELINE.revenue).toFixed(2),
      negative: +(CATE.headcountToRevenue(-10) / 100 * BASELINE.revenue).toFixed(2),
    },
    {
      lever:    "Marketing (+50%/−30%)",
      positive: +(CATE.mktgToRevenue(50)  / 100 * BASELINE.revenue).toFixed(2),
      negative: +(CATE.mktgToRevenue(-30) / 100 * BASELINE.revenue).toFixed(2),
    },
    {
      lever:    "Rate (±100bps on margin)",
      positive: +(CATE.rateToDebtService(-100) * -4).toFixed(2),
      negative: +(CATE.rateToDebtService(100)  * -4).toFixed(2),
    },
  ].sort((a, b) => Math.abs(b.positive) - Math.abs(a.positive));

  // ── Banner logic ──────────────────────────────────────────────────────
  const anyActive = price !== 0 || mktg !== 0 || headcount !== 0 || rate !== 0;
  const revDir    = scenario.revDeltaPct >= 0 ? "up" : "down";
  const signal    =
    !anyActive                              ? "blue"  :
    scenario.grossMargin < 30              ? "red"   :
    scenario.revenue > BASELINE.revenue    ? "green" : "amber";

  const bannerMsg = !anyActive
    ? "Adjust the sliders to model the causal impact of pricing, marketing, headcount, and rate changes on revenue, margin, and cash."
    : `Scenario projects revenue ${revDir} ${Math.abs(scenario.revDeltaPct).toFixed(1)}% to $${scenario.revenue}M and gross margin ${scenario.marginDeltaPp >= 0 ? "up" : "down"} ${Math.abs(scenario.marginDeltaPp).toFixed(1)}pp to ${scenario.grossMargin}%. ${rate !== 0 ? `BoC shock adds $${(scenario.debtDelta * 1000).toFixed(0)}K to quarterly debt service.` : ""}`;

  return (
    <div>
      {/* ── Header ────────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">What-If Simulator</h1>
        <p className="text-signal-muted text-sm mt-1">
          Causal intervention modelling · DoubleML CATE · results update instantly
        </p>
      </div>

      {/* ── Banner ────────────────────────────────────────────────────── */}
      <InsightBanner
        title={anyActive ? "Scenario Active" : "No scenario — adjust sliders to begin"}
        message={bannerMsg}
        signal={signal}
        updated={new Date().toISOString()}
      />

      {/* ── Sliders (2×2 grid) ────────────────────────────────────────── */}
      <SectionTitle>Intervention Levers</SectionTitle>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Slider config={SLIDERS[0]} value={price}     onChange={setPrice}     />
        <Slider config={SLIDERS[1]} value={mktg}      onChange={setMktg}      />
        <Slider config={SLIDERS[2]} value={headcount} onChange={setHeadcount} />
        <Slider config={SLIDERS[3]} value={rate}      onChange={setRate}      />
      </div>

      {/* ── KPI comparison row ────────────────────────────────────────── */}
      <SectionTitle>Baseline vs Scenario</SectionTitle>
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <KPICard
          label="Scenario Revenue"
          value={`$${scenario.revenue}M`}
          delta={`${scenario.revDeltaPct >= 0 ? "+" : ""}${scenario.revDeltaPct.toFixed(1)}% vs base`}
          signal={scenario.revenue >= BASELINE.revenue ? "green" : "red"}
          caption={`Base: $${BASELINE.revenue}M`}
        />
        <KPICard
          label="Gross Margin"
          value={`${scenario.grossMargin}%`}
          delta={`${scenario.marginDeltaPp >= 0 ? "+" : ""}${scenario.marginDeltaPp.toFixed(1)}pp vs base`}
          signal={scenario.grossMargin >= BASELINE.grossMargin ? "green" : scenario.grossMargin >= 30 ? "amber" : "red"}
          caption={`Base: ${BASELINE.grossMargin}%`}
        />
        <KPICard
          label="EBITDA"
          value={`$${scenario.ebitda}M`}
          delta={`${scenario.ebitda >= BASELINE.ebitda ? "+" : ""}$${(scenario.ebitda - BASELINE.ebitda).toFixed(2)}M`}
          signal={scenario.ebitda >= BASELINE.ebitda ? "green" : "amber"}
          caption={`Base: $${BASELINE.ebitda}M`}
        />
        <KPICard
          label="Debt Service"
          value={`$${(scenario.debtService * 1000).toFixed(0)}K`}
          delta={`${scenario.debtDelta >= 0 ? "+" : ""}$${(scenario.debtDelta * 1000).toFixed(0)}K vs base`}
          signal={scenario.debtDelta <= 0 ? "green" : scenario.debtDelta < 0.03 ? "amber" : "red"}
          caption={`Base: $${(BASELINE.debtService * 1000).toFixed(0)}K / quarter`}
        />
        <KPICard
          label="Cash Position"
          value={`$${scenario.cash}M`}
          delta={`${scenario.cash >= BASELINE.cashQ ? "+" : ""}$${(scenario.cash - BASELINE.cashQ).toFixed(2)}M`}
          signal={scenario.cash >= BASELINE.cashQ ? "green" : scenario.cash >= 5 ? "amber" : "red"}
          caption={`Base: $${BASELINE.cashQ}M`}
        />
      </div>

      {/* ── Scenario comparison table ─────────────────────────────────── */}
      <SectionTitle>Scenario Comparison</SectionTitle>
      <div className="card overflow-x-auto">
        <p className="text-white text-sm font-medium mb-4">
          Baseline · Current Scenario · Stress (Combined)
        </p>
        <div className="min-w-[540px]">
          {/* Header */}
          <div className="grid grid-cols-4 gap-4 px-3 py-2 border-b border-navy-border text-xs text-signal-muted uppercase tracking-wider">
            <span>Metric</span>
            <span className="text-center">Baseline</span>
            <span className="text-center" style={{ color: C.blue }}>Scenario</span>
            <span className="text-center" style={{ color: C.red }}>Stress (−20% rev)</span>
          </div>
          {[
            { label: "Quarterly Revenue",  base: `$${BASELINE.revenue}M`,             scen: `$${scenario.revenue}M`,            stress: `$${(BASELINE.revenue * 0.8).toFixed(2)}M` },
            { label: "Gross Margin",       base: `${BASELINE.grossMargin}%`,           scen: `${scenario.grossMargin}%`,         stress: `${(BASELINE.grossMargin - 3.2).toFixed(1)}%` },
            { label: "EBITDA",             base: `$${BASELINE.ebitda}M`,              scen: `$${scenario.ebitda}M`,             stress: `$${(BASELINE.ebitda * 0.55).toFixed(2)}M` },
            { label: "Debt Service / Qtr", base: `$${(BASELINE.debtService*1000).toFixed(0)}K`, scen: `$${(scenario.debtService*1000).toFixed(0)}K`, stress: `$${(BASELINE.debtService*1000+95).toFixed(0)}K` },
            { label: "Cash (end Qtr)",     base: `$${BASELINE.cashQ}M`,              scen: `$${scenario.cash}M`,               stress: `$${(BASELINE.cashQ - 1.4).toFixed(2)}M` },
            { label: "DSCR",               base: `${(BASELINE.ebitda/BASELINE.debtService/4).toFixed(2)}×`, scen: `${(scenario.ebitda/scenario.debtService/4).toFixed(2)}×`, stress: `1.09×` },
          ].map((row) => (
            <div
              key={row.label}
              className="grid grid-cols-4 gap-4 px-3 py-2.5 border-b border-navy-border hover:bg-navy-border/20 transition-colors"
            >
              <span className="text-sm text-signal-muted">{row.label}</span>
              <span className="text-sm font-mono text-white text-center">{row.base}</span>
              <span className="text-sm font-mono text-center font-medium" style={{ color: C.blue }}>{row.scen}</span>
              <span className="text-sm font-mono text-center" style={{ color: C.red }}>{row.stress}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Waterfall + Tornado ───────────────────────────────────────── */}
      <SectionTitle>Revenue Impact Decomposition</SectionTitle>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Revenue waterfall */}
        <div className="card">
          <p className="text-white text-sm font-medium">Revenue Bridge — Baseline to Scenario</p>
          <p className="text-signal-muted text-xs mt-0.5 mb-4">
            Contribution of each lever · $M quarterly
          </p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={waterfallData}
              margin={{ top: 16, right: 20, left: -4, bottom: 0 }}
              barCategoryGap="22%"
            >
              <CartesianGrid stroke={C.grid} strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="label" {...axisProps} />
              <YAxis
                domain={[
                  Math.min(BASELINE.revenue, scenario.revenue) - 0.3,
                  Math.max(BASELINE.revenue, scenario.revenue) + 0.3,
                ]}
                {...axisProps}
                tickFormatter={(v) => `$${v.toFixed(1)}M`}
              />
              <Tooltip
                contentStyle={tooltipBase}
                formatter={(v: any, _: any, props: any) => {
                  const d = waterfallData.find((r) => r.label === props?.payload?.label);
                  if (!d) return [v];
                  return [d.displayLabel, d.label];
                }}
                cursor={{ fill: C.grid, opacity: 0.3 }}
              />
              {/* Invisible float base */}
              <Bar dataKey="floatBase" stackId="wf" fill="transparent" legendType="none" />
              {/* Visible bar */}
              <Bar dataKey="barValue" stackId="wf" radius={[4, 4, 0, 0]} legendType="none">
                {waterfallData.map((d, i) => (
                  <Cell key={i} fill={d.colour} fillOpacity={0.88} />
                ))}
                <LabelList
                  dataKey="displayLabel"
                  position="top"
                  style={{ fill: C.text, fontSize: 10 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Sensitivity tornado */}
        <div className="card">
          <p className="text-white text-sm font-medium">Sensitivity Tornado</p>
          <p className="text-signal-muted text-xs mt-0.5 mb-4">
            Revenue impact of each lever at max setting · $M swing
          </p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={tornadoData}
              layout="vertical"
              margin={{ top: 4, right: 64, left: 8, bottom: 4 }}
              barCategoryGap="28%"
            >
              <CartesianGrid stroke={C.grid} strokeDasharray="3 3" horizontal={false} />
              <XAxis
                type="number"
                {...axisProps}
                tickFormatter={(v) => `${v >= 0 ? "+" : ""}$${Math.abs(v).toFixed(1)}M`}
              />
              <YAxis
                type="category"
                dataKey="lever"
                {...axisProps}
                width={148}
                tick={{ fill: C.muted, fontSize: 10 }}
              />
              <Tooltip
                contentStyle={tooltipBase}
                formatter={(v: any, name: string) => [
                  `${Number(v) >= 0 ? "+" : ""}$${Math.abs(Number(v)).toFixed(2)}M`,
                  name === "positive" ? "Upside" : "Downside",
                ]}
                cursor={{ fill: C.grid, opacity: 0.3 }}
              />
              <ReferenceLine x={0} stroke={C.muted} strokeWidth={1} />
              <Bar dataKey="positive" fill={C.green} opacity={0.85} radius={[0, 4, 4, 0]} barSize={18}>
                <LabelList
                  dataKey="positive"
                  position="right"
                  formatter={(v: any) => `+$${Number(v).toFixed(2)}M`}
                  style={{ fill: C.green, fontSize: 10 }}
                />
              </Bar>
              <Bar dataKey="negative" fill={C.red} opacity={0.80} radius={[0, 4, 4, 0]} barSize={18}>
                <LabelList
                  dataKey="negative"
                  position="left"
                  formatter={(v: any) => `$${Number(v).toFixed(2)}M`}
                  style={{ fill: C.red, fontSize: 10 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <p className="text-xs text-signal-muted mt-3 pt-3 border-t border-navy-border">
            Price is the highest-leverage lever. Marketing shows diminishing returns above +30%.
          </p>
        </div>
      </div>

      {/* ── Methodology ───────────────────────────────────────────────── */}
      <p className="text-xs text-signal-muted mt-8 border-t border-navy-border pt-4">
        Causal deltas estimated via DoubleML Partially Linear Regression (PLR). Treatment
        variables: price delta %, marketing spend delta %, headcount delta %, BoC rate bps.
        Outcome: quarterly revenue and gross margin. Confounders: macro cycle phase,
        seasonality index, customer concentration. CATE coefficients pre-computed —
        ONNX worker wires in live inference in Session 12.
      </p>
    </div>
  );
}