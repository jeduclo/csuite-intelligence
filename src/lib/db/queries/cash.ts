// src/lib/db/queries/cash.ts
// Queries for the Cash Forecast page — AP/AR weekly net position.

import { query } from "../load";

export interface WeeklyCashFlow {
  week:   string;   // "W1", "W2" etc
  ar:     number;   // AR receipts $K
  ap:     number;   // AP payments $K
  net:    number;   // AR - AP $K
  actual: number | null;  // cumulative cash (null for forecast weeks)
}

// ── 13 weeks of actual AP/AR ───────────────────────────────────────────────
export async function getWeeklyCashFlows(): Promise<WeeklyCashFlow[]> {
  const rows = await query<{
    week_start: string;
    ar_receipts: number;
    ap_payments: number;
  }>(`
    WITH
    -- Weekly AR receipts (paid invoices only)
    weekly_ar AS (
      SELECT
        DATE_TRUNC('week', invoice_date::DATE) AS week_start,
        SUM(CASE WHEN paid THEN amount ELSE 0 END) / 1000 AS ar_receipts
      FROM ar_aging
      WHERE invoice_date >= CURRENT_DATE - INTERVAL '13 weeks'
      GROUP BY 1
    ),
    -- Weekly AP payments
    weekly_ap AS (
      SELECT
        DATE_TRUNC('week', invoice_date::DATE) AS week_start,
        SUM(CASE WHEN paid THEN amount ELSE 0 END) / 1000 AS ap_payments
      FROM ap
      WHERE invoice_date >= CURRENT_DATE - INTERVAL '13 weeks'
      GROUP BY 1
    )
    SELECT
      COALESCE(ar.week_start, ap.week_start)    AS week_start,
      ROUND(COALESCE(ar.ar_receipts, 0), 0)     AS ar_receipts,
      ROUND(COALESCE(ap.ap_payments, 0), 0)     AS ap_payments
    FROM weekly_ar ar
    FULL OUTER JOIN weekly_ap ap USING (week_start)
    ORDER BY week_start
  `);

  // Build running cash position (seed from a starting balance)
  const SEED_CASH_K = 7820; // $7.82M in $K — matches our baseline
  let running = SEED_CASH_K;

  return rows.map((r, i) => {
    const net = r.ar_receipts - r.ap_payments;
    running  += net;
    return {
      week:   `W${i + 1}`,
      ar:     Math.round(r.ar_receipts),
      ap:     Math.round(r.ap_payments),
      net:    Math.round(net),
      actual: +(running / 1000).toFixed(2), // convert to $M
    };
  });
}

// ── AR aging summary ───────────────────────────────────────────────────────
export interface ARAgingSummary {
  current:    number;  // $K — 0-30 days
  overdue30:  number;  // $K — 31-60 days
  overdue60:  number;  // $K — 61-90 days
  overdue90:  number;  // $K — 90+ days
}

export async function getARAgingSummary(): Promise<ARAgingSummary> {
  const rows = await query<ARAgingSummary>(`
    SELECT
      ROUND(SUM(CASE WHEN days_outstanding <= 30 AND NOT paid
                     THEN amount ELSE 0 END) / 1000, 0) AS "current",
      ROUND(SUM(CASE WHEN days_outstanding BETWEEN 31 AND 60 AND NOT paid
                     THEN amount ELSE 0 END) / 1000, 0) AS "overdue30",
      ROUND(SUM(CASE WHEN days_outstanding BETWEEN 61 AND 90 AND NOT paid
                     THEN amount ELSE 0 END) / 1000, 0) AS "overdue60",
      ROUND(SUM(CASE WHEN days_outstanding > 90 AND NOT paid
                     THEN amount ELSE 0 END) / 1000, 0) AS "overdue90"
    FROM ar_aging
  `);
  return rows[0];
}