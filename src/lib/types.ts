export type MovementType =
  | "purchase"
  | "receipt"
  | "sale"
  | "return"
  | "transfer"
  | "adjustment"
  | "damage"
  | "expiry"
  | "quarantine"
  | "write_off"
  | "import";

export type BatchStatus = "active" | "quarantined" | "damaged" | "expired" | "written_off";

export type ExpiryStatus = "expired" | "expiring_30" | "expiring_60" | "expiring_90" | "healthy" | "unknown";

export type StockStatus = "out_of_stock" | "low_stock" | "overstock" | "slow_moving" | "healthy";

export interface Warehouse {
  id: string;
  name: string;
  location: string | null;
}

export interface Supplier {
  id: string;
  name: string;
  contactInfo: string | null;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  category: string | null;
  defaultSupplierId: string | null;
  reorderPoint: number;
  avgDailySales: number;
  lastSaleDate: string | null;
}

export interface Batch {
  id: string;
  productId: string;
  warehouseId: string;
  batchNumber: string;
  manufacturingDate: string | null;
  expiryDate: string | null;
  quantity: number;
  availableQty: number;
  reservedQty: number;
  damagedQty: number;
  quarantinedQty: number;
  purchasePrice: number;
  supplierId: string | null;
  purchaseReference: string | null;
  status: BatchStatus;
}

/** One row per batch, with product/warehouse/supplier names resolved and
 * status flags computed — this is what the Inventory page and Dashboard
 * actually render. */
export interface InventoryRecord {
  batchId: string;
  productId: string;
  productName: string;
  sku: string;
  category: string | null;
  warehouseId: string;
  warehouseName: string;
  batchNumber: string;
  manufacturingDate: string | null;
  expiryDate: string | null;
  quantity: number;
  availableQty: number;
  reservedQty: number;
  damagedQty: number;
  quarantinedQty: number;
  purchasePrice: number;
  value: number;
  supplierId: string | null;
  supplierName: string | null;
  status: BatchStatus;
  daysToExpiry: number | null;
  expiryStatus: ExpiryStatus;
  reorderPoint: number;
  avgDailySales: number;
  stockStatus: StockStatus;
}

export interface StockMovement {
  id: string;
  batchId: string;
  movementType: MovementType;
  quantityChange: number;
  previousQty: number;
  newQty: number;
  reference: string | null;
  warehouseId: string | null;
  notes: string | null;
  createdAt: string;
}

/** One row from an uploaded file, after header mapping — the unit the
 * reconciliation engine operates on. */
export interface ImportRow {
  productName: string;
  sku: string;
  batchNumber: string;
  warehouseName: string;
  quantity: number;
  purchasePrice: number;
  manufacturingDate: string | null;
  expiryDate: string | null;
  supplierName: string | null;
  category: string | null;
}

export type ReconciliationAction = "new_product" | "new_batch" | "update_batch" | "duplicate" | "error";

export interface ReconciliationItem {
  rowIndex: number;
  row: ImportRow;
  action: ReconciliationAction;
  issues: string[];
  existingBatchId?: string;
  existingProductId?: string;
  quantityDelta?: number;
}

export interface ReconciliationSummary {
  totalRows: number;
  newProducts: number;
  newBatches: number;
  updatedBatches: number;
  duplicates: number;
  errors: number;
  items: ReconciliationItem[];
}

export interface DashboardKpis {
  totalInventoryValue: number;
  totalSkus: number;
  availableStock: number;
  lowStockCount: number;
  outOfStockCount: number;
  nearExpiryCount: number;
  nearExpiryValue: number;
  expiredCount: number;
  expiredValue: number;
}
