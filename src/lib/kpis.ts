import type { ClassifiedInventoryRow, DashboardKpis } from "./types";

/** Rough restock cost for a Keep & Reorder item: enough to cover ~30 days
 * of sales at the current rate, minus what's already on hand. Falls back to
 * "buy back what you currently hold" when there's no sales-velocity data. */
function estimatedReorderCost(row: ClassifiedInventoryRow): number {
  if (row.classification !== "Keep & Reorder") return 0;

  const targetQty = row.avgDailySales > 0 ? row.avgDailySales * 30 : row.quantityOnHand;
  const shortfall = targetQty - row.quantityOnHand;
  const qtyToBuy = shortfall > 0 ? shortfall : row.quantityOnHand;

  return qtyToBuy * row.costPrice;
}

export function computeKpis(rows: ClassifiedInventoryRow[]): DashboardKpis {
  const totalInventoryValue = rows.reduce((sum, r) => sum + r.value, 0);
  const sellOffRows = rows.filter((r) => r.classification === "Sell off");
  const slowDeadStockValue = sellOffRows.reduce((sum, r) => sum + r.value, 0);
  const productsToReorder = rows.filter((r) => r.classification === "Keep & Reorder").length;
  const cashNeededToReorder = rows.reduce((sum, r) => sum + estimatedReorderCost(r), 0);

  const expiringSoonRows = rows.filter((r) => r.expiryStatus === "expiring-soon");
  const expiredRows = rows.filter((r) => r.expiryStatus === "expired");

  return {
    totalInventoryValue,
    slowDeadStockValue,
    productsToReorder,
    // Clearing the sell-off stock is what frees this capital up.
    capitalToFreeUp: slowDeadStockValue,
    expiringSoonCount: expiringSoonRows.length,
    expiringSoonValue: expiringSoonRows.reduce((sum, r) => sum + r.value, 0),
    expiredCount: expiredRows.length,
    expiredValue: expiredRows.reduce((sum, r) => sum + r.value, 0),
    cashNeededToReorder,
  };
}
