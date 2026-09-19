// src/lib/db/queries/revenue.ts
// Channel × region waterfall, margin, SKU pareto.

import { query } from "../load";

// ── Monthly revenue by channel ─────────────────────────────────────────────
export interface ChannelRevenue {
  month:       string;
  Direct:      number;
  Distributor: number;
  Online:      number;
  Partner:     number;
}

export async function getChannelRevenue(
  region: string = "All"
): Promise<ChannelRevenue[]> {
  const regionFilter = region === "All"
    ? ""
    : `AND region = '${region}'`;

  return query<ChannelRevenue>(`
    SELECT
      STRFTIME(DATE_TRUNC('month', date::DATE), '%b') AS month,
      ROUND(SUM(CASE WHEN channel = 'Direct'      THEN revenue ELSE 0 END) / 1e6, 2) AS "Direct",
      ROUND(SUM(CASE WHEN channel = 'Distributor' THEN revenue ELSE 0 END) / 1e6, 2) AS "Distributor",
      ROUND(SUM(CASE WHEN channel = 'Online'      THEN revenue ELSE 0 END) / 1e6, 2) AS "Online",
      ROUND(SUM(CASE WHEN channel = 'Partner'     THEN revenue ELSE 0 END) / 1e6, 2) AS "Partner"
    FROM orders
    WHERE date >= CURRENT_DATE - INTERVAL '9 months'
    ${regionFilter}
    GROUP BY DATE_TRUNC('month', date::DATE), month
    ORDER BY DATE_TRUNC('month', date::DATE)
  `);
}

// ── Channel margin summary ─────────────────────────────────────────────────
export interface ChannelMargin {
  channel:    string;
  margin_pct: number;
  revenue:    number;  // $M
}

export async function getChannelMargins(): Promise<ChannelMargin[]> {
  return query<ChannelMargin>(`
    SELECT
      channel,
      ROUND(AVG(gross_margin) * 100, 1) AS margin_pct,
      ROUND(SUM(revenue) / 1e6, 2)      AS revenue
    FROM orders
    WHERE date >= CURRENT_DATE - INTERVAL '9 months'
    GROUP BY channel
    ORDER BY margin_pct DESC
  `);
}

// ── SKU pareto — top 8 + bottom 5 by gross margin $ ──────────────────────
export interface SKUContribution {
  sku:        string;
  margin:     number;  // $K gross margin
  revenue:    number;  // $K revenue
  marginPct:  number;  // gross margin %
  type:       "top" | "bottom";
}

export async function getSKUPareto(): Promise<SKUContribution[]> {
  const rows = await query<{
    sku: string;
    margin_k: number;
    revenue_k: number;
    margin_pct: number;
  }>(`
    WITH sku_summary AS (
      SELECT
        sku,
        ROUND(SUM(revenue * gross_margin) / 1000, 0) AS margin_k,
        ROUND(SUM(revenue) / 1000, 0)                AS revenue_k,
        ROUND(AVG(gross_margin) * 100, 1)            AS margin_pct
      FROM orders
      WHERE date >= CURRENT_DATE - INTERVAL '9 months'
      GROUP BY sku
    ),
    ranked AS (
      SELECT *,
        ROW_NUMBER() OVER (ORDER BY margin_k DESC) AS rank_top,
        ROW_NUMBER() OVER (ORDER BY margin_k ASC)  AS rank_bottom
      FROM sku_summary
    )
    SELECT sku, margin_k, revenue_k, margin_pct
    FROM ranked
    WHERE rank_top <= 8 OR rank_bottom <= 5
    ORDER BY margin_k DESC
  `);

  // Get overall top/bottom threshold
  const topMargins    = rows.slice(0, 8).map((r) => r.margin_k);
  const minTopMargin  = Math.min(...topMargins);

  return rows.map((r) => ({
    sku:       r.sku,
    margin:    r.margin_k,
    revenue:   r.revenue_k,
    marginPct: r.margin_pct,
    type:      r.margin_k >= minTopMargin ? "top" : "bottom",
  }));
}

// ── Quarterly revenue for forecast chart ──────────────────────────────────
export interface QuarterlyRevenue {
  quarter: string;
  actual:  number | null;
  p10:     number | null;
  p50:     number | null;
  p90:     number | null;
}

export async function getQuarterlyRevenue(): Promise<QuarterlyRevenue[]> {
  const actuals = await query<{ quarter: string; actual: number }>(`
    SELECT
      STRFTIME(DATE_TRUNC('quarter', date::DATE), 'Q%q ''%y') AS quarter,
      ROUND(SUM(revenue) / 1e6, 2)                            AS actual
    FROM orders
    GROUP BY DATE_TRUNC('quarter', date::DATE), quarter
    ORDER BY DATE_TRUNC('quarter', date::DATE)
  `);

  // Append 3 future quarters with static forecast bands
  // (XGBoost ONNX will replace these in the ONNX session)
  const lastActual = actuals[actuals.length - 1]?.actual ?? 4.0;
  const forecasts: QuarterlyRevenue[] = [
    { quarter: "Q4 '25", actual: null, p10: +(lastActual * 0.90).toFixed(2), p50: +(lastActual * 1.08).toFixed(2), p90: +(lastActual * 1.25).toFixed(2) },
    { quarter: "Q1 '26", actual: null, p10: +(lastActual * 0.93).toFixed(2), p50: +(lastActual * 1.12).toFixed(2), p90: +(lastActual * 1.31).toFixed(2) },
    { quarter: "Q2 '26", actual: null, p10: +(lastActual * 0.96).toFixed(2), p50: +(lastActual * 1.16).toFixed(2), p90: +(lastActual * 1.38).toFixed(2) },
  ];

  return [
    ...actuals.map((r) => ({ ...r, p10: null, p50: null, p90: null })),
    ...forecasts,
  ];
}