// src/lib/db/init.ts
// DuckDB-Wasm loads once and is reused across all pages.
// Pattern: singleton promise — only one instance, cached after first call.
import * as duckdb from "@duckdb/duckdb-wasm";

let db: duckdb.AsyncDuckDB | null = null;

/**
 * Returns the shared DuckDB-Wasm database instance.
 * Loads the WASM bundle on first call (~1-2 seconds), cached thereafter.
 */
export async function getDB(): Promise<duckdb.AsyncDuckDB> {
  if (db) return db;

  // Load the CDN-hosted WASM bundle (no local file needed)
  const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();
  const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

  const worker_url = URL.createObjectURL(
    new Blob([`importScripts("${bundle.mainWorker!}");`], {
      type: "text/javascript",
    })
  );

  const worker = new Worker(worker_url);
  const logger = new duckdb.ConsoleLogger(duckdb.LogLevel.WARNING);
  db = new duckdb.AsyncDuckDB(logger, worker);

  await db.instantiate(bundle.mainModule, bundle.pthreadWorker);
  URL.revokeObjectURL(worker_url);

  return db;
}