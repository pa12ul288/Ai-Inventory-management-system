import type { ClassifiedInventoryRow, DashboardKpis } from "./types";

export function computeKpis(rows: ClassifiedInventoryRow[]): DashboardKpis {
  const totalInventoryValue = rows.reduce((sum, r) => sum + r.value, 0);
  const sellOffRows = rows.filter((r) => r.classification === "Sell off");
  const slowDeadStockValue = sellOffRows.reduce((sum, r) => sum + r.value, 0);
  const productsToReorder = rows.filter((r) => r.classification === "Keep & Reorder").length;

  return {
    totalInventoryValue,
    slowDeadStockValue,
    productsToReorder,
    // Clearing the sell-off stock is what frees this capital up.
    capitalToFreeUp: slowDeadStockValue,
  };
}
