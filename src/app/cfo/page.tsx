// src/app/cfo/page.tsx
// CFO Overview — answers 2 questions:
//   1. What is our current financial health signal?
//   2. Are any covenants at risk?
"use client";

import { KPICard }      from "@/components/ui/KPICard";
import { InsightBanner } from "@/components/ui/InsightBanner";

// ── Static values for now — will be replaced by DuckDB queries in Step 6 ──
const KPIs = [
  {
    label:   "Cash Position (Week 13)",
    value:   "$6.97M",
    delta:   "-$420K vs last week",
    signal:  "amber" as const,
    caption: "13-week rolling AP/AR net. Updated weekly.",
  },
  {
    label:   "DSCR vs Covenant Floor",
    value:   "1.18×",
    delta:   "Floor: 1.25×",
    signal:  "red" as const,
    caption: "Debt Service Coverage Ratio. Breach risk in 6 weeks at current burn.",
  },
  {
    label:   "Revenue Forecast P50 (Q3)",
    value:   "$4.2M",
    delta:   "+3.1% vs prior Q",
    signal:  "green" as const,
    caption: "XGBoost P50 forecast. P10: $3.8M | P90: $4.7M",
  },
  {
    label:   "60-Day Customer Default Risk",
    value:   "3 accounts",
    delta:   "$1.1M at risk",
    signal:  "red" as const,
    caption: "XGBoost scoring on DSO trend + invoice concentration.",
  },
  {
    label:   "Gross Margin (Trailing 3M)",
    value:   "34.2%",
    delta:   "-1.8pp vs prior Q",
    signal:  "amber" as const,
    caption: "Revenue minus COGS. Compression driven by SKU-Group B.",
  },
  {
    label:   "Macro Cycle Phase",
    value:   "Mid-Cycle",
    delta:   "BoC @ 2.25%",
    signal:  "blue" as const,
    caption: "Classified from yield spread + CPI + policy rate trajectory.",
  },
];

export default function CFOOverviewPage() {
  return (
    <div>
      {/* Page header */}
      <div className="mb-6">
        <h1 className="text-2xl font-semibold text-white">CFO Overview</h1>
        <p className="text-signal-muted text-sm mt-1">
          What your ERP cannot tell you — in under 60 seconds.
        </p>
      </div>

      {/* Prescriptive action banner — always first */}
      <InsightBanner
        title="DSCR is 0.07× above covenant floor"
        message="At current burn rate, covenant breach risk in 6 weeks. Recommend reviewing discretionary capex and accelerating Q3 AR collections before next lender review."
        signal="red"
        updated={new Date().toISOString()}
      />

      {/* KPI grid — 2 columns on mobile, 3 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {KPIs.map((kpi) => (
          <KPICard key={kpi.label} {...kpi} />
        ))}
      </div>

      {/* Methodology note */}
      <p className="text-xs text-signal-muted mt-8 border-t border-navy-border pt-4">
        All forecasts use XGBoost trained on 8 quarters of ERP transactional data
        combined with BoC rate trajectory and StatCan CPI. Models run in-browser via
        ONNX Runtime Web — no data leaves your device.
      </p>
    </div>
  );
}