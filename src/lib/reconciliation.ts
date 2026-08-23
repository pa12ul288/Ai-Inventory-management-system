import type { ImportRow, ReconciliationItem, ReconciliationSummary } from "./types";

export interface ExistingProductLookup {
  id: string;
  sku: string;
  name: string;
}

export interface ExistingBatchLookup {
  id: string;
  productId: string;
  warehouseName: string;
  batchNumber: string;
}

function norm(s: string): string {
  return s.trim().toLowerCase();
}

/** Pure diff engine: given the rows from an uploaded file and what already
 * exists, classify every row as a new product, a new batch on an existing
 * product, an update to an existing batch, a duplicate within this same
 * file, or a validation error. Never writes anything — the caller decides
 * whether/how to commit the result after the user reviews it. */
export function reconcileImport(
  rows: ImportRow[],
  existingProducts: ExistingProductLookup[],
  existingBatches: ExistingBatchLookup[],
  defaultWarehouseName: string
): ReconciliationSummary {
  const productBySku = new Map(existingProducts.filter((p) => p.sku).map((p) => [norm(p.sku), p]));
  const productByName = new Map(existingProducts.map((p) => [norm(p.name), p]));

  const batchKey = (productId: string, warehouseName: string, batchNumber: string) =>
    `${productId}::${norm(warehouseName)}::${norm(batchNumber)}`;
  const existingBatchMap = new Map(
    existingBatches.map((b) => [batchKey(b.productId, b.warehouseName, b.batchNumber), b])
  );

  const seenInFile = new Set<string>();
  const items: ReconciliationItem[] = [];

  rows.forEach((row, rowIndex) => {
    const hardIssues: string[] = [];
    const softIssues: string[] = [];

    if (!row.productName) hardIssues.push("Missing product name");
    if (!row.quantity || row.quantity <= 0) hardIssues.push("Quantity must be greater than zero");
    if (row.manufacturingDate && row.expiryDate && row.manufacturingDate > row.expiryDate) {
      hardIssues.push("Manufacturing date is after expiry date");
    }
    if (!row.sku) softIssues.push("No SKU provided — matched by product name only");

    if (hardIssues.length > 0) {
      items.push({ rowIndex, row, action: "error", issues: hardIssues });
      return;
    }

    const warehouseName = row.warehouseName || defaultWarehouseName;
    const dupKey = `${norm(row.sku || row.productName)}::${norm(warehouseName)}::${norm(row.batchNumber)}`;

    if (seenInFile.has(dupKey)) {
      items.push({
        rowIndex,
        row,
        action: "duplicate",
        issues: ["Duplicate of an earlier row in this file (same product, warehouse, and batch)"],
      });
      return;
    }
    seenInFile.add(dupKey);

    const existingProduct = (row.sku && productBySku.get(norm(row.sku))) || productByName.get(norm(row.productName));

    if (!existingProduct) {
      items.push({ rowIndex, row, action: "new_product", issues: softIssues });
      return;
    }

    const key = batchKey(existingProduct.id, warehouseName, row.batchNumber);
    const existingBatch = existingBatchMap.get(key);

    if (!existingBatch) {
      items.push({
        rowIndex,
        row,
        action: "new_batch",
        issues: softIssues,
        existingProductId: existingProduct.id,
      });
      return;
    }

    items.push({
      rowIndex,
      row,
      action: "update_batch",
      issues: softIssues,
      existingProductId: existingProduct.id,
      existingBatchId: existingBatch.id,
    });
  });

  return {
    totalRows: rows.length,
    newProducts: items.filter((i) => i.action === "new_product").length,
    newBatches: items.filter((i) => i.action === "new_batch").length,
    updatedBatches: items.filter((i) => i.action === "update_batch").length,
    duplicates: items.filter((i) => i.action === "duplicate").length,
    errors: items.filter((i) => i.action === "error").length,
    items,
  };
}
