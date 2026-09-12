// src/lib/schema/erp.ts
// Zod schemas validate incoming JSON before it enters DuckDB.
// If the data shape changes, the pipeline catches it here — not in the UI.
import { z } from "zod";

export const OrderSchema = z.object({
  order_id:     z.string(),
  date:         z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  customer_id:  z.string(),
  sku:          z.string(),
  qty:          z.number().int().positive(),
  unit_price:   z.number().positive(),
  gross_margin: z.number().min(0).max(1),
  revenue:      z.number().positive(),
  region:       z.string(),
  channel:      z.string(),
});

export const ARAgingSchema = z.object({
  invoice_id:       z.string(),
  customer_id:      z.string(),
  invoice_date:     z.string(),
  due_date:         z.string(),
  amount:           z.number().positive(),
  days_outstanding: z.number().int().min(0),
  paid:             z.boolean(),
  is_high_risk:     z.boolean(),
});

// Array versions — validates the full dataset at load time
export const OrdersSchema    = z.array(OrderSchema);
export const ARAgingArraySchema = z.array(ARAgingSchema);