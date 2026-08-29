"use client";

import { useMemo } from "react";
import { useAppData } from "@/lib/AppDataContext";
import PageStats from "@/components/PageStats";
import { formatInr } from "@/lib/format";

interface ProductAgg {
  productId: string;
  productName: string;
  sku: string;
  supplierName: string | null;
  availableQty: number;
  reorderPoint: number;
  avgDailySales: number;
  purchasePrice: number;
}

const TARGET_DAYS = 30;

export default function ReorderIntelligencePage() {
  const { records } = useAppData();

  const rows = useMemo(() => {
    const map = new Map<string, ProductAgg>();
    for (const r of records) {
      let p = map.get(r.productId);
      if (!p) {
        p = {
          productId: r.productId,
          productName: r.productName,
          sku: r.sku,
          supplierName: r.supplierName,
          availableQty: 0,
          reorderPoint: r.reorderPoint,
          avgDailySales: r.avgDailySales,
          purchasePrice: r.purchasePrice,
        };
        map.set(r.productId, p);
      }
      p.availableQty += r.availableQty;
      if (!p.supplierName && r.supplierName) p.supplierName = r.supplierName;
    }

    return Array.from(map.values())
      .filter((p) => p.reorderPoint > 0 && p.availableQty <= p.reorderPoint)
      .map((p) => {
        const targetQty = p.avgDailySales > 0 ? p.avgDailySales * TARGET_DAYS : p.reorderPoint * 2;
        const suggestedOrderQty = Math.max(0, Math.ceil(targetQty - p.availableQty));
        return { ...p, suggestedOrderQty, estimatedCost: suggestedOrderQty * p.purchasePrice };
      })
      .sort((a, b) => a.availableQty - b.availableQty);
  }, [records]);

  const totalEstimatedCost = rows.reduce((s, r) => s + r.estimatedCost, 0);
  const zeroStock = rows.filter((r) => r.availableQty === 0).length;

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
      <h1 className="mb-1 text-2xl font-bold text-slate-900">Reorder Intelligence</h1>
      <p className="mb-6 text-sm text-slate-500">
        Products at or below their reorder point, with a suggested order quantity to bring stock up to{" "}
        {TARGET_DAYS} days of cover at the current sales rate (or 2× reorder point where sales history is missing).
      </p>

      <PageStats
        items={[
          { label: "Products Needing Reorder", value: String(rows.length) },
          { label: "Currently Zero Stock", value: String(zeroStock), accent: zeroStock > 0 ? "text-red-600" : undefined },
          { label: "Estimated Reorder Cost", value: formatInr(totalEstimatedCost) },
        ]}
      />

      <div className="overflow-auto rounded-lg border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2.5 text-left font-medium text-slate-600">Product</th>
              <th className="px-3 py-2.5 text-left font-medium text-slate-600">Supplier</th>
              <th className="px-3 py-2.5 text-right font-medium text-slate-600">In Stock</th>
              <th className="px-3 py-2.5 text-right font-medium text-slate-600">Reorder Point</th>
              <th className="px-3 py-2.5 text-right font-medium text-slate-600">Suggested Order Qty</th>
              <th className="px-3 py-2.5 text-right font-medium text-slate-600">Est. Cost</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.productId} className="bg-white hover:bg-slate-50">
                <td className="px-3 py-2.5">
                  <p className="font-medium text-slate-800">{r.productName}</p>
                  <p className="text-xs text-slate-400">{r.sku}</p>
                </td>
                <td className="px-3 py-2.5 text-slate-600">{r.supplierName ?? "—"}</td>
                <td className={`px-3 py-2.5 text-right ${r.availableQty === 0 ? "font-medium text-red-600" : "text-slate-700"}`}>
                  {r.availableQty}
                </td>
                <td className="px-3 py-2.5 text-right text-slate-700">{r.reorderPoint}</td>
                <td className="px-3 py-2.5 text-right font-medium text-slate-800">{r.suggestedOrderQty}</td>
                <td className="px-3 py-2.5 text-right text-slate-700">{formatInr(r.estimatedCost)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-sm text-slate-400">
                  Nothing needs reordering right now.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-slate-400">
        Reorder points are set per product; a product with no reorder point set never appears here even at zero
        stock. Lead time from suppliers isn&apos;t tracked, so the suggested quantity assumes you can restock
        promptly — treat it as a starting point, not a purchase order.
      </p>
    </div>
  );
}
