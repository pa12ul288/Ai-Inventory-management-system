import type { ExpiryStatus } from "./expiry";

export type Classification = "Sell off" | "Watch" | "Keep & Reorder";

export interface RawInventoryRow {
  productName: string;
  sku: string;
  quantityOnHand: number;
  costPrice: number;
  lastSaleDate: string | null;
  avgDailySales: number;
  expiryDate: string | null;
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
  daysToExpiry: number | null;
  expiryStatus: ExpiryStatus;
}

export interface DashboardKpis {
  totalInventoryValue: number;
  slowDeadStockValue: number;
  productsToReorder: number;
  capitalToFreeUp: number;
  expiringSoonCount: number;
  expiringSoonValue: number;
  expiredCount: number;
  expiredValue: number;
  cashNeededToReorder: number;
}
