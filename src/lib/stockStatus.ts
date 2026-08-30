import type { BatchStatus, ExpiryStatus, StockStatus } from "./types";

export function computeExpiryStatus(expiryDate: string | null): { daysToExpiry: number | null; expiryStatus: ExpiryStatus } {
  if (!expiryDate) return { daysToExpiry: null, expiryStatus: "unknown" };

  const expiry = new Date(expiryDate);
  if (Number.isNaN(expiry.getTime())) return { daysToExpiry: null, expiryStatus: "unknown" };

  const daysToExpiry = Math.floor((expiry.getTime() - Date.now()) / 86400000);

  if (daysToExpiry <= 0) return { daysToExpiry, expiryStatus: "expired" };
  if (daysToExpiry <= 30) return { daysToExpiry, expiryStatus: "expiring_30" };
  if (daysToExpiry <= 60) return { daysToExpiry, expiryStatus: "expiring_60" };
  if (daysToExpiry <= 90) return { daysToExpiry, expiryStatus: "expiring_90" };
  return { daysToExpiry, expiryStatus: "healthy" };
}

/** Deterministic, explainable stock-status rules — no AI classification.
 * - out_of_stock: nothing available to sell right now.
 * - low_stock: at or below the product's reorder point (only meaningful
 *   once a reorder point is actually set).
 * - overstock: more than ~6 months of stock at the current sales rate.
 * - slow_moving: stock exists above a deliberately-set reorder point, but
 *   zero sales have been recorded — a reorder point of 0 means the product
 *   was never configured for reorder tracking, so it's left healthy rather
 *   than flagged.
 * - healthy: everything else, including unconfigured products with no
 *   sales history. */
export function computeStockStatus(
  availableQty: number,
  reorderPoint: number,
  avgDailySales: number
): StockStatus {
  if (availableQty <= 0) return "out_of_stock";
  if (reorderPoint > 0 && availableQty <= reorderPoint) return "low_stock";
  if (avgDailySales > 0 && availableQty / avgDailySales > 180) return "overstock";
  if (avgDailySales === 0 && reorderPoint > 0 && availableQty > reorderPoint) return "slow_moving";
  return "healthy";
}

export function batchStatusLabel(status: BatchStatus): string {
  switch (status) {
    case "active":
      return "Active";
    case "quarantined":
      return "Quarantined";
    case "damaged":
      return "Damaged";
    case "expired":
      return "Expired";
    case "written_off":
      return "Written Off";
  }
}
