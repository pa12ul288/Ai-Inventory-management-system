import Papa from "papaparse";
import type { InventoryRecord } from "./types";
import { batchStatusLabel } from "./stockStatus";

export function downloadInventoryCsv(records: InventoryRecord[], filename = "inventory-export.csv") {
  const csv = Papa.unparse(
    records.map((r) => ({
      "Product Name": r.productName,
      SKU: r.sku,
      Batch: r.batchNumber,
      Warehouse: r.warehouseName,
      "Manufacturing Date": r.manufacturingDate ?? "",
      "Expiry Date": r.expiryDate ?? "",
      Quantity: r.quantity,
      Available: r.availableQty,
      Reserved: r.reservedQty,
      Damaged: r.damagedQty,
      Quarantined: r.quarantinedQty,
      "Purchase Price": r.purchasePrice.toFixed(2),
      "Value (₹)": r.value.toFixed(2),
      Supplier: r.supplierName ?? "",
      "Batch Status": batchStatusLabel(r.status),
      "Stock Status": r.stockStatus,
      "Days to Expiry": r.daysToExpiry ?? "",
    }))
  );

  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
