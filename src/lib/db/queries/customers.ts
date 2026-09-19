// src/lib/db/queries/customers.ts
// DSO per customer, concentration, default feature vectors.

import { query } from "../load";

// ── Customer DSO summary ───────────────────────────────────────────────────
export interface CustomerDSORow {
  customer_id:    string;
  avg_dso:        number;   // days
  outstanding_ar: number;   // $K unpaid
  rev_share:      number;   // % of total revenue
  invoice_count:  number;
  overdue_pct:    number;   // % of invoices overdue
  is_high_risk:   boolean;
}

export async function getCustomerDSO(): Promise<CustomerDSORow[]> {
  return query<CustomerDSORow>(`
    WITH totals AS (
      SELECT SUM(amount) AS total_ar FROM ar_aging
    ),
    customer_summary AS (
      SELECT
        a.customer_id,
        ROUND(AVG(a.days_outstanding), 0)                       AS avg_dso,
        ROUND(SUM(CASE WHEN NOT a.paid THEN a.amount ELSE 0 END) / 1000, 1) AS outstanding_ar,
        ROUND(SUM(a.amount) / totals.total_ar * 100, 1)         AS rev_share,
        COUNT(*)                                                 AS invoice_count,
        ROUND(AVG(CASE WHEN a.days_outstanding > 30 AND NOT a.paid
                       THEN 1.0 ELSE 0.0 END) * 100, 1)         AS overdue_pct,
        BOOL_OR(a.is_high_risk)                                  AS is_high_risk
      FROM ar_aging a, totals
      GROUP BY a.customer_id, totals.total_ar
    )
    SELECT *
    FROM customer_summary
    ORDER BY outstanding_ar DESC
    LIMIT 20
  `);
}

// ── DSO trend per customer (last 6 months) ────────────────────────────────
export interface CustomerDSOTrend {
  customer_id: string;
  month:       string;
  avg_dso:     number;
}

export async function getCustomerDSOTrend(
  customerIds: string[]
): Promise<CustomerDSOTrend[]> {
  const ids = customerIds.map((id) => `'${id}'`).join(", ");
  return query<CustomerDSOTrend>(`
    SELECT
      customer_id,
      STRFTIME(DATE_TRUNC('month', invoice_date::DATE), '%b') AS month,
      ROUND(AVG(days_outstanding), 0)                         AS avg_dso
    FROM ar_aging
    WHERE customer_id IN (${ids})
      AND invoice_date >= CURRENT_DATE - INTERVAL '6 months'
    GROUP BY customer_id, DATE_TRUNC('month', invoice_date::DATE), month
    ORDER BY customer_id, DATE_TRUNC('month', invoice_date::DATE)
  `);
}

// ── Revenue concentration ──────────────────────────────────────────────────
export interface ConcentrationRow {
  label: string;
  pct:   number;
}

export async function getRevenueConcentration(): Promise<ConcentrationRow[]> {
  const rows = await query<{ customer_id: string; revenue: number }>(`
    SELECT
      customer_id,
      SUM(revenue) AS revenue
    FROM orders
    WHERE date >= CURRENT_DATE - INTERVAL '12 months'
    GROUP BY customer_id
    ORDER BY revenue DESC
  `);

  const total = rows.reduce((s, r) => s + r.revenue, 0);
  const withPct = rows.map((r) => ({
    customer_id: r.customer_id,
    pct: +(r.revenue / total * 100).toFixed(1),
  }));

  // Bucket into tiers
  return [
    { label: "Top 1",  pct: withPct[0]?.pct ?? 0 },
    { label: "Top 2",  pct: withPct[1]?.pct ?? 0 },
    { label: "Top 3",  pct: withPct[2]?.pct ?? 0 },
    { label: "Top 4",  pct: withPct[3]?.pct ?? 0 },
    { label: "Top 5",  pct: withPct[4]?.pct ?? 0 },
    { label: "6–10",   pct: +withPct.slice(5, 10).reduce((s, r) => s + r.pct, 0).toFixed(1) },
    { label: "11–20",  pct: +withPct.slice(10, 20).reduce((s, r) => s + r.pct, 0).toFixed(1) },
    { label: "Rest",   pct: +withPct.slice(20).reduce((s, r) => s + r.pct, 0).toFixed(1) },
  ];
}

// ── Default probability (rule-based until ONNX session) ───────────────────
// Combines DSO acceleration + overdue % + concentration into a risk score
export interface DefaultScore {
  customer_id:    string;
  default_prob:   number;    // 0–100
  risk_tier:      "High" | "Medium" | "Low";
  dso_score:      number;    // contribution
  overdue_score:  number;    // contribution
  conc_score:     number;    // contribution
}

export async function getDefaultScores(): Promise<DefaultScore[]> {
  const rows = await getCustomerDSO();

  return rows.map((r) => {
    // Rule-based scoring (ONNX XGBoost replaces this in next session)
    const dsoScore     = Math.min(100, (r.avg_dso / 90) * 100);
    const overdueScore = r.overdue_pct;
    const concScore    = Math.min(100, r.rev_share * 5);

    // Weighted composite
    const prob = Math.min(95, Math.round(
      dsoScore     * 0.45 +
      overdueScore * 0.35 +
      concScore    * 0.20
    ));

    const tier: "High" | "Medium" | "Low" =
      prob >= 60 ? "High" : prob >= 30 ? "Medium" : "Low";

    return {
      customer_id:   r.customer_id,
      default_prob:  prob,
      risk_tier:     tier,
      dso_score:     Math.round(dsoScore),
      overdue_score: Math.round(overdueScore),
      conc_score:    Math.round(concScore),
    };
  });
}