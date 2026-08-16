import Papa from "papaparse";
import type { ClassifiedInventoryRow } from "./types";

export function downloadInventoryCsv(rows: ClassifiedInventoryRow[], filename = "inventory-export.csv") {
  const csv = Papa.unparse(
    rows.map((r) => ({
      "Product Name": r.productName,
      SKU: r.sku,
      "Stock Quantity": r.quantityOnHand,
      "Value (₹)": r.value.toFixed(2),
      "Days in Stock": r.daysInStock ?? "",
      "AI Recommendation": r.classification,
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
