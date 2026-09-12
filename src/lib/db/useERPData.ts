// src/lib/db/useERPData.ts
// React hook that:
//   1. Fetches the JSON files
//   2. Validates with Zod
//   3. Registers them in DuckDB as in-memory tables
//   4. Returns the DB connection ready for SQL queries
"use client";

import { useState, useEffect } from "react";
import { getDB } from "./init";
import { OrdersSchema, ARAgingArraySchema } from "@/lib/schema/erp";

export type DBStatus = "idle" | "loading" | "ready" | "error";

/**
 * Loads ERP JSON files into DuckDB-Wasm.
 * Returns the DB instance and a loading status.
 * Call this hook once in the root layout or a top-level page.
 */
export function useERPData() {
  const [status, setStatus] = useState<DBStatus>("idle");
  const [error, setError]   = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setStatus("loading");
      try {
        const db = await getDB();
        const conn = await db.connect();

        // Fetch + validate orders
        const rawOrders = await fetch("/data/erp/orders.json").then((r) => r.json());
        const orders = OrdersSchema.parse(rawOrders);

        // Fetch + validate AR aging
        const rawAR = await fetch("/data/erp/ar_aging.json").then((r) => r.json());
        const arAging = ARAgingArraySchema.parse(rawAR);

        // Register as DuckDB tables
        await db.registerFileText("orders.json", JSON.stringify(orders));
        await conn.query(`
          CREATE OR REPLACE TABLE orders AS
          SELECT * FROM read_json_auto('orders.json');
        `);

        await db.registerFileText("ar_aging.json", JSON.stringify(arAging));
        await conn.query(`
          CREATE OR REPLACE TABLE ar_aging AS
          SELECT * FROM read_json_auto('ar_aging.json');
        `);

        await conn.close();
        if (!cancelled) setStatus("ready");
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : String(err));
          setStatus("error");
        }
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  return { status, error };
}