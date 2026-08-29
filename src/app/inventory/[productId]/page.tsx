"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAppData } from "@/lib/AppDataContext";
import { fetchProductMovements, type ProductMovement } from "@/lib/inventoryData";
import PageStats from "@/components/PageStats";
import StockStatusBadge from "@/components/StockStatusBadge";
import ExpiryBadge from "@/components/ExpiryBadge";
import BatchStatusBadge from "@/components/BatchStatusBadge";
import { formatInr } from "@/lib/format";

export default function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const { records } = useAppData();
  const [movements, setMovements] = useState<ProductMovement[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(true);

  useEffect(() => {
    if (!productId) return;
    fetchProductMovements(productId)
      .then(setMovements)
      .finally(() => setLoadingMovements(false));
  }, [productId]);

  const batches = useMemo(() => records.filter((r) => r.productId === productId), [records, productId]);
  const product = batches[0];

  const totalAvailable = batches.reduce((s, r) => s + r.availableQty, 0);
  const totalValue = batches.reduce((s, r) => s + r.value, 0);

  if (!product) {
    return (
      <div className="mx-auto w-full max-w-4xl flex-1 px-6 py-8">
        <Link href="/inventory" className="text-sm text-teal-600 hover:underline">
          ← Back to Inventory
        </Link>
        <p className="mt-6 text-sm text-slate-400">
          No batches found for this product — it may have been removed, or this page was reached from an old link.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-6 py-8">
      <Link href="/inventory" className="text-sm text-teal-600 hover:underline">
        ← Back to Inventory
      </Link>

      <div className="mt-3 mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{product.productName}</h1>
          <p className="text-sm text-slate-500">
            {product.sku || "No SKU"} {product.category ? `· ${product.category}` : ""}
          </p>
        </div>
        <StockStatusBadge status={product.stockStatus} />
      </div>

      <PageStats
        items={[
          { label: "Total Available", value: String(totalAvailable) },
          { label: "Total Value", value: formatInr(totalValue) },
          { label: "Avg Daily Sales", value: `${product.avgDailySales.toFixed(1)}/day` },
          { label: "Reorder Point", value: String(product.reorderPoint) },
        ]}
      />

      <h2 className="mb-3 text-sm font-semibold text-slate-900">Batches ({batches.length})</h2>
      <div className="mb-8 overflow-auto rounded-xl border border-slate-200 shadow-sm shadow-slate-200/40">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2.5 text-left font-medium text-slate-600">Batch</th>
              <th className="px-3 py-2.5 text-left font-medium text-slate-600">Warehouse</th>
              <th className="px-3 py-2.5 text-right font-medium text-slate-600">Available</th>
              <th className="px-3 py-2.5 text-left font-medium text-slate-600">Expiry</th>
              <th className="px-3 py-2.5 text-right font-medium text-slate-600">Value</th>
              <th className="px-3 py-2.5 text-left font-medium text-slate-600">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {batches.map((b) => (
              <tr key={b.batchId} className="bg-white hover:bg-slate-50">
                <td className="px-3 py-2.5 font-medium text-slate-800">{b.batchNumber}</td>
                <td className="px-3 py-2.5 text-slate-600">{b.warehouseName}</td>
                <td className="px-3 py-2.5 text-right text-slate-700">{b.availableQty}</td>
                <td className="px-3 py-2.5">
                  <ExpiryBadge status={b.expiryStatus} daysToExpiry={b.daysToExpiry} />
                </td>
                <td className="px-3 py-2.5 text-right text-slate-700">{formatInr(b.value)}</td>
                <td className="px-3 py-2.5">
                  <BatchStatusBadge status={b.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 className="mb-3 text-sm font-semibold text-slate-900">Movement History</h2>
      <div className="overflow-auto rounded-xl border border-slate-200 shadow-sm shadow-slate-200/40">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2.5 text-left font-medium text-slate-600">When</th>
              <th className="px-3 py-2.5 text-left font-medium text-slate-600">Batch</th>
              <th className="px-3 py-2.5 text-left font-medium text-slate-600">Type</th>
              <th className="px-3 py-2.5 text-right font-medium text-slate-600">Change</th>
              <th className="px-3 py-2.5 text-right font-medium text-slate-600">Resulting Qty</th>
              <th className="px-3 py-2.5 text-left font-medium text-slate-600">Reference</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {movements.map((m) => (
              <tr key={m.id} className="bg-white hover:bg-slate-50">
                <td className="px-3 py-2.5 text-slate-600">{new Date(m.createdAt).toLocaleString()}</td>
                <td className="px-3 py-2.5 text-slate-600">{m.batchNumber}</td>
                <td className="px-3 py-2.5 text-slate-700">{m.movementType.replace("_", " ")}</td>
                <td className={`px-3 py-2.5 text-right ${m.quantityChange >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                  {m.quantityChange >= 0 ? "+" : ""}
                  {m.quantityChange}
                </td>
                <td className="px-3 py-2.5 text-right text-slate-700">{m.newQty}</td>
                <td className="px-3 py-2.5 text-slate-500">{m.reference ?? "—"}</td>
              </tr>
            ))}
            {!loadingMovements && movements.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-sm text-slate-400">
                  No movement history recorded for this product yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
