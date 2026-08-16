import type { Classification, RawInventoryRow } from "./types";

export interface InventoryFeatures {
  daysInStock: number | null;
  daysOnHand: number | null;
}

export function computeFeatures(row: RawInventoryRow): InventoryFeatures {
  let daysInStock: number | null = null;
  if (row.lastSaleDate) {
    const lastSale = new Date(row.lastSaleDate);
    if (!Number.isNaN(lastSale.getTime())) {
      const diffMs = Date.now() - lastSale.getTime();
      daysInStock = Math.max(0, Math.floor(diffMs / 86400000));
    }
  }

  const daysOnHand =
    row.avgDailySales > 0 ? row.quantityOnHand / row.avgDailySales : null;

  return { daysInStock, daysOnHand };
}

/** Deterministic application of the PRD's exact rules (section 5). Used as
 * the source of truth and as a fallback if the Gemini call is unavailable. */
export function ruleClassify(features: InventoryFeatures): Classification {
  const { daysInStock, daysOnHand } = features;

  const noMovement60Plus = daysInStock !== null && daysInStock >= 60;
  const daysOnHandOver90 = daysOnHand !== null && daysOnHand > 90;
  if (noMovement60Plus || daysOnHandOver90) return "Sell off";

  const runsOutUnder14 = daysOnHand !== null && daysOnHand < 14;
  const recentAndLowStock =
    daysInStock !== null && daysInStock <= 30 && daysOnHand !== null && daysOnHand < 30;
  if (runsOutUnder14 || recentAndLowStock) return "Keep & Reorder";

  return "Watch";
}
