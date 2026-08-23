import type { DashboardKpis, InventoryRecord } from "./types";

export function computeKpis(records: InventoryRecord[]): DashboardKpis {
  const totalInventoryValue = records.reduce((sum, r) => sum + r.value, 0);
  const totalSkus = new Set(records.map((r) => r.productId)).size;
  const availableStock = records.reduce((sum, r) => sum + r.availableQty, 0);

  const lowStock = records.filter((r) => r.stockStatus === "low_stock");
  const outOfStock = records.filter((r) => r.stockStatus === "out_of_stock");

  const nearExpiry = records.filter(
    (r) => r.expiryStatus === "expiring_30" || r.expiryStatus === "expiring_60" || r.expiryStatus === "expiring_90"
  );
  const expired = records.filter((r) => r.expiryStatus === "expired");

  return {
    totalInventoryValue,
    totalSkus,
    availableStock,
    lowStockCount: lowStock.length,
    outOfStockCount: outOfStock.length,
    nearExpiryCount: nearExpiry.length,
    nearExpiryValue: nearExpiry.reduce((sum, r) => sum + r.value, 0),
    expiredCount: expired.length,
    expiredValue: expired.reduce((sum, r) => sum + r.value, 0),
  };
}
