"use client";

import { useMemo } from "react";
import { useAppData } from "@/lib/AppDataContext";
import PageStats from "@/components/PageStats";
import { formatInr } from "@/lib/format";

interface SupplierRow {
  id: string;
  name: string;
  products: Set<string>;
  batches: number;
  activeBatches: number;
  purchaseValue: number;
}

export default function SuppliersPage() {
  const { records, suppliers } = useAppData();

  const rows = useMemo(() => {
    const map = new Map<string, SupplierRow>();

    for (const s of suppliers) {
      map.set(s.id, { id: s.id, name: s.name, products: new Set(), batches: 0, activeBatches: 0, purchaseValue: 0 });
    }

    for (const r of records) {
      if (!r.supplierId) continue;
      let row = map.get(r.supplierId);
      if (!row) {
        row = { id: r.supplierId, name: r.supplierName ?? "Unknown supplier", products: new Set(), batches: 0, activeBatches: 0, purchaseValue: 0 };
        map.set(r.supplierId, row);
      }
      row.products.add(r.productId);
      row.batches += 1;
      if (r.status === "active") row.activeBatches += 1;
      row.purchaseValue += r.quantity * r.purchasePrice;
    }

    return Array.from(map.values()).sort((a, b) => b.purchaseValue - a.purchaseValue);
  }, [records, suppliers]);

  const totalPurchaseValue = rows.reduce((sum, r) => sum + r.purchaseValue, 0);
  const noSupplierValue = records
    .filter((r) => !r.supplierId)
    .reduce((sum, r) => sum + r.quantity * r.purchasePrice, 0);

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
      <h1 className="mb-1 text-2xl font-bold text-slate-900">Suppliers</h1>
      <p className="mb-6 text-sm text-slate-500">Purchase volume and batch history by supplier.</p>

      <PageStats
        items={[
          { label: "Active Suppliers", value: String(rows.length) },
          { label: "Total Purchase Value", value: formatInr(totalPurchaseValue) },
          { label: "Batches on Record", value: String(records.length) },
          { label: "No Supplier Recorded", value: formatInr(noSupplierValue), accent: noSupplierValue > 0 ? "text-amber-600" : undefined },
        ]}
      />

      <div className="overflow-auto rounded-xl border border-slate-200 shadow-sm shadow-slate-200/40">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2.5 text-left font-medium text-slate-600">Supplier</th>
              <th className="px-3 py-2.5 text-right font-medium text-slate-600">Products Supplied</th>
              <th className="px-3 py-2.5 text-right font-medium text-slate-600">Batches</th>
              <th className="px-3 py-2.5 text-right font-medium text-slate-600">Active Batches</th>
              <th className="px-3 py-2.5 text-right font-medium text-slate-600">Purchase Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.id} className="bg-white hover:bg-slate-50">
                <td className="px-3 py-2.5 font-medium text-slate-800">{r.name}</td>
                <td className="px-3 py-2.5 text-right text-slate-700">{r.products.size}</td>
                <td className="px-3 py-2.5 text-right text-slate-700">{r.batches}</td>
                <td className="px-3 py-2.5 text-right text-slate-700">{r.activeBatches}</td>
                <td className="px-3 py-2.5 text-right text-slate-800">{formatInr(r.purchaseValue)}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-sm text-slate-400">
                  No suppliers recorded yet — they&apos;re created automatically the first time you reference one in
                  an import or manual entry.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-xs text-slate-400">
        Lead time and delivery reliability aren&apos;t tracked yet — that needs expected-vs-actual delivery dates per
        purchase, which isn&apos;t in the data model. Let me know if you want that added.
      </p>
    </div>
  );
}
