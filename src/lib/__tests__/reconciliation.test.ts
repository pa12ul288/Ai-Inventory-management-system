import { describe, it } from "node:test";
import assert from "node:assert";
import { reconcileImport, type ExistingBatchLookup, type ExistingProductLookup } from "../reconciliation.ts";
import type { ImportRow } from "../types.ts";

function row(overrides: Partial<ImportRow> = {}): ImportRow {
  return {
    productName: "Paracetamol 500mg",
    sku: "PARA500",
    batchNumber: "B001",
    warehouseName: "Main Warehouse",
    quantity: 100,
    purchasePrice: 10,
    manufacturingDate: null,
    expiryDate: null,
    supplierName: null,
    category: null,
    ...overrides,
  };
}

const DEFAULT_WAREHOUSE = "Main Warehouse";

describe("reconcileImport", () => {
  it("returns an empty summary for no rows", () => {
    const summary = reconcileImport([], [], [], DEFAULT_WAREHOUSE);
    assert.strictEqual(summary.totalRows, 0);
    assert.strictEqual(summary.items.length, 0);
  });

  it("flags a row with no product name as an error", () => {
    const summary = reconcileImport([row({ productName: "" })], [], [], DEFAULT_WAREHOUSE);
    assert.strictEqual(summary.items[0].action, "error");
  });

  it("flags a row with quantity <= 0 as an error", () => {
    const summary = reconcileImport([row({ quantity: 0 })], [], [], DEFAULT_WAREHOUSE);
    assert.strictEqual(summary.items[0].action, "error");
  });

  it("classifies an unrecognized product as new_product", () => {
    const summary = reconcileImport([row()], [], [], DEFAULT_WAREHOUSE);
    assert.strictEqual(summary.items[0].action, "new_product");
  });

  it("classifies a known SKU with an unrecognized batch as new_batch", () => {
    const existingProducts: ExistingProductLookup[] = [{ id: "p1", sku: "PARA500", name: "Paracetamol 500mg" }];
    const summary = reconcileImport([row()], existingProducts, [], DEFAULT_WAREHOUSE);
    assert.strictEqual(summary.items[0].action, "new_batch");
    assert.strictEqual(summary.items[0].existingProductId, "p1");
  });

  it("classifies a known SKU with a known batch as update_batch", () => {
    const existingProducts: ExistingProductLookup[] = [{ id: "p1", sku: "PARA500", name: "Paracetamol 500mg" }];
    const existingBatches: ExistingBatchLookup[] = [
      { id: "b1", productId: "p1", warehouseName: "Main Warehouse", batchNumber: "B001" },
    ];
    const summary = reconcileImport([row()], existingProducts, existingBatches, DEFAULT_WAREHOUSE);
    assert.strictEqual(summary.items[0].action, "update_batch");
    assert.strictEqual(summary.items[0].existingBatchId, "b1");
  });

  it("classifies the second of two identical rows as a duplicate", () => {
    const summary = reconcileImport([row(), row()], [], [], DEFAULT_WAREHOUSE);
    assert.strictEqual(summary.items[0].action, "new_product");
    assert.strictEqual(summary.items[1].action, "duplicate");
  });
});
