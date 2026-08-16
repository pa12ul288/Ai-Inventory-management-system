export type Classification = "Sell off" | "Watch" | "Keep & Reorder";

export interface RawInventoryRow {
  productName: string;
  sku: string;
  quantityOnHand: number;
  costPrice: number;
  lastSaleDate: string | null;
  avgDailySales: number;
}

export interface IdentifiedRow extends RawInventoryRow {
  id: string;
}

export interface ClassifiedInventoryRow extends RawInventoryRow {
  id: string;
  value: number;
  daysInStock: number | null;
  daysOnHand: number | null;
  classification: Classification;
}

export interface DashboardKpis {
  totalInventoryValue: number;
  slowDeadStockValue: number;
  productsToReorder: number;
  capitalToFreeUp: number;
}
