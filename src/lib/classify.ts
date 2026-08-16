import type { Classification, RawInventoryRow } from "./types";

export interface InventoryFeatures {
  daysInStock: number | null;
  daysOnHand: number | null;
  lastSaleDate: string | null;
  quantityOnHand: number;
}

export function computeFeatures(row: RawInventoryRow): InventoryFeatures {
  let daysInStock: number | null = null;
  const today = new Date();
  if (row.lastSaleDate) {
    const lastSale = new Date(row.lastSaleDate);
    if (!Number.isNaN(lastSale.getTime())) {
      const diffMs = today.getTime() - lastSale.getTime();
      daysInStock = Math.max(0, Math.floor(diffMs / 86400000));
    }
    console.log(
      `[classify] product="${row.productName}" lastSaleDate raw="${row.lastSaleDate}" ` +
        `parsed=${Number.isNaN(lastSale.getTime()) ? "INVALID" : lastSale.toISOString()} ` +
        `today=${today.toISOString()} daysInStock=${daysInStock}`
    );
  }

  const daysOnHand =
    row.avgDailySales > 0 ? row.quantityOnHand / row.avgDailySales : null;

  return { daysInStock, daysOnHand, lastSaleDate: row.lastSaleDate, quantityOnHand: row.quantityOnHand };
}

function soldInAugust2026(dateStr: string | null): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return false;
  return d.getUTCFullYear() === 2026 && d.getUTCMonth() === 7; // August = month index 7
}

/** Deterministic application of the PRD's exact rules (section 5), plus a
 * simplified Keep & Reorder trigger that doesn't depend on avgDailySales
 * being present. Used as the source of truth and as a fallback if the
 * Gemini call is unavailable. */
export function ruleClassify(features: InventoryFeatures): Classification {
  const { daysInStock, daysOnHand, lastSaleDate, quantityOnHand } = features;

  const noMovement60Plus = daysInStock !== null && daysInStock >= 60;
  const daysOnHandOver90 = daysOnHand !== null && daysOnHand > 90;
  if (noMovement60Plus || daysOnHandOver90) return "Sell off";

  const runsOutUnder14 = daysOnHand !== null && daysOnHand < 14;
  const soldAugustLowStock = soldInAugust2026(lastSaleDate) && quantityOnHand < 500;
  if (runsOutUnder14 || soldAugustLowStock) return "Keep & Reorder";

  return "Watch";
}
