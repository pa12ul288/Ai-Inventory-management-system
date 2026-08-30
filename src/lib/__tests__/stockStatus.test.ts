import { describe, it } from "node:test";
import assert from "node:assert";
import { computeExpiryStatus, computeStockStatus } from "../stockStatus.ts";

function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

describe("computeExpiryStatus", () => {
  it("returns unknown for a null date", () => {
    assert.strictEqual(computeExpiryStatus(null).expiryStatus, "unknown");
  });

  it("returns expired for a past date", () => {
    assert.strictEqual(computeExpiryStatus(daysFromNow(-5)).expiryStatus, "expired");
  });

  it("returns expiring_30 for 15 days out", () => {
    assert.strictEqual(computeExpiryStatus(daysFromNow(15)).expiryStatus, "expiring_30");
  });

  it("returns expiring_60 for 45 days out", () => {
    assert.strictEqual(computeExpiryStatus(daysFromNow(45)).expiryStatus, "expiring_60");
  });

  it("returns expiring_90 for 75 days out", () => {
    assert.strictEqual(computeExpiryStatus(daysFromNow(75)).expiryStatus, "expiring_90");
  });

  it("returns healthy for 120 days out", () => {
    assert.strictEqual(computeExpiryStatus(daysFromNow(120)).expiryStatus, "healthy");
  });
});

describe("computeStockStatus", () => {
  it("returns out_of_stock when quantity is 0", () => {
    assert.strictEqual(computeStockStatus(0, 10, 5), "out_of_stock");
  });

  it("returns low_stock when quantity is at or below a positive reorder point", () => {
    assert.strictEqual(computeStockStatus(10, 10, 5), "low_stock");
  });

  it("returns overstock when quantity/avgDailySales exceeds 180 days", () => {
    assert.strictEqual(computeStockStatus(1000, 0, 5), "overstock");
  });

  it("returns healthy when avgDailySales is 0 and reorderPoint is 0", () => {
    assert.strictEqual(computeStockStatus(50, 0, 0), "healthy");
  });

  it("returns slow_moving when avgDailySales is 0 and reorderPoint is set", () => {
    assert.strictEqual(computeStockStatus(50, 10, 0), "slow_moving");
  });
});
