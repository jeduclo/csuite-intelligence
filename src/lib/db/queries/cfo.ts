// src/lib/db/queries/cfo.ts
// Queries that power the CFO Overview page KPI cards and charts.

import { query } from "../load";

// ── CFO health KPIs ────────────────────────────────────────────────────────
export interface CFOKPIs {
  totalRevenueLTM:    number;  // $M — last 12 months
  avgMonthlyRevenue:  number;  // $M
  grossMarginPct:     number;  // %
  marginDeltaPp:      number;  // pp change vs prior quarter
  totalAROutstanding: number;  // $M
  overdueAR60d:       number;  // $M — >60 days
}

export async function getCFOKPIs(): Promise<CFOKPIs> {
  const rows = await query<CFOKPIs>(`
    WITH
    -- Revenue and margin from orders
    revenue AS (
      SELECT
        SUM(revenue)                                    AS total_revenue,
        SUM(revenue) / 12.0                             AS avg_monthly,
        AVG(gross_margin) * 100                         AS avg_margin_pct
      FROM orders
      WHERE date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '12 months')
    ),
    -- Prior quarter margin for delta
    current_q AS (
      SELECT AVG(gross_margin) * 100 AS margin
      FROM orders
      WHERE date >= DATE_TRUNC('quarter', CURRENT_DATE)
    ),
    prior_q AS (
      SELECT AVG(gross_margin) * 100 AS margin
      FROM orders
      WHERE date >= DATE_TRUNC('quarter', CURRENT_DATE - INTERVAL '3 months')
        AND date <  DATE_TRUNC('quarter', CURRENT_DATE)
    ),
    -- AR outstanding
    ar AS (
      SELECT
        SUM(amount) / 1e6                               AS total_ar,
        SUM(CASE WHEN days_outstanding > 60 AND NOT paid
                 THEN amount ELSE 0 END) / 1e6          AS overdue_60d
      FROM ar_aging
    )
    SELECT
      ROUND(revenue.total_revenue / 1e6, 2)   AS "totalRevenueLTM",
      ROUND(revenue.avg_monthly / 1e6, 2)     AS "avgMonthlyRevenue",
      ROUND(revenue.avg_margin_pct, 1)        AS "grossMarginPct",
      ROUND(current_q.margin - prior_q.margin, 1) AS "marginDeltaPp",
      ROUND(ar.total_ar, 2)                   AS "totalAROutstanding",
      ROUND(ar.overdue_60d, 2)                AS "overdueAR60d"
    FROM revenue, current_q, prior_q, ar
  `);
  return rows[0];
}

// ── 13-week revenue trend (for sparkline on CFO overview) ─────────────────
export interface WeeklyRevenue {
  week:    string;
  revenue: number;  // $M
  margin:  number;  // %
}

export async function getWeeklyRevenueTrend(): Promise<WeeklyRevenue[]> {
  return query<WeeklyRevenue>(`
    SELECT
      STRFTIME(DATE_TRUNC('week', date::DATE), '%Y-W%W') AS week,
      ROUND(SUM(revenue) / 1e6, 3)                       AS revenue,
      ROUND(AVG(gross_margin) * 100, 1)                  AS margin
    FROM orders
    WHERE date >= CURRENT_DATE - INTERVAL '13 weeks'
    GROUP BY 1
    ORDER BY 1
  `);
}

// ── Monthly revenue for CFO overview chart ─────────────────────────────────
export interface MonthlyRevenue {
  month:    string;  // "Jan", "Feb" etc
  actual:   number;  // $M
  forecast: number | null;
}

export async function getMonthlyRevenue(): Promise<MonthlyRevenue[]> {
  return query<MonthlyRevenue>(`
    SELECT
      STRFTIME(DATE_TRUNC('month', date::DATE), '%b')    AS month,
      ROUND(SUM(revenue) / 1e6, 2)                       AS actual,
      NULL                                               AS forecast
    FROM orders
    WHERE date >= CURRENT_DATE - INTERVAL '9 months'
    GROUP BY DATE_TRUNC('month', date::DATE), month
    ORDER BY DATE_TRUNC('month', date::DATE)
  `);
}

// ── Margin trend (9 months) for CFO overview chart ────────────────────────
export interface MonthlyMargin {
  month:  string;
  margin: number;  // gross margin %
  ippi:   number;  // placeholder — replaced by macro data
}

export async function getMonthlyMargin(): Promise<MonthlyMargin[]> {
  return query<MonthlyMargin>(`
    SELECT
      STRFTIME(DATE_TRUNC('month', date::DATE), '%b') AS month,
      ROUND(AVG(gross_margin) * 100, 1)               AS margin,
      0                                               AS ippi   -- joined from macro later
    FROM orders
    WHERE date >= CURRENT_DATE - INTERVAL '9 months'
    GROUP BY DATE_TRUNC('month', date::DATE), month
    ORDER BY DATE_TRUNC('month', date::DATE)
  `);
}