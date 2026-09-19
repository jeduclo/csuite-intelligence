// src/lib/db/load.ts
// Loads all ERP JSON files into DuckDB-Wasm as in-memory tables.
// Call loadERPTables() once before running any query.
// Uses a module-level promise so the load only happens once
// even if multiple components call it simultaneously.

import { getDB } from "./init";

let loadPromise: Promise<void> | null = null;

export async function loadERPTables(): Promise<void> {
  // Return the same promise if already loading or loaded
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const db   = await getDB();
    const conn = await db.connect();

    try {
      // Fetch all four ERP files in parallel
      const [orders, arAging, ap, payroll] = await Promise.all([
        fetch("/data/erp/orders.json").then((r) => r.json()),
        fetch("/data/erp/ar_aging.json").then((r) => r.json()),
        fetch("/data/erp/ap.json").then((r) => r.json()),
        fetch("/data/erp/payroll.json").then((r) => r.json()),
      ]);

      // Register each file and create a table from it
      const tables = [
        { name: "orders",    data: orders    },
        { name: "ar_aging",  data: arAging   },
        { name: "ap",        data: ap        },
        { name: "payroll",   data: payroll   },
      ];

      for (const { name, data } of tables) {
        const filename = `${name}.json`;
        await db.registerFileText(filename, JSON.stringify(data));
        await conn.query(`
          CREATE OR REPLACE TABLE ${name} AS
          SELECT * FROM read_json_auto('${filename}');
        `);
      }

      // Verify row counts in dev
      if (process.env.NODE_ENV === "development") {
        for (const { name } of tables) {
          const result = await conn.query(`SELECT COUNT(*) as n FROM ${name}`);
          const n = result.toArray()[0]?.n ?? 0;
          console.log(`[DuckDB] ${name}: ${n} rows`);
        }
      }
    } finally {
      await conn.close();
    }
  })();

  return loadPromise;
}

// Helper: run a query and return results as plain objects
export async function query<T = Record<string, unknown>>(
  sql: string
): Promise<T[]> {
  await loadERPTables();
  const db   = await getDB();
  const conn = await db.connect();
  try {
    const result = await conn.query(sql);
    return result.toArray().map((row: any) => ({ ...row })) as T[];
  } finally {
    await conn.close();
  }
}