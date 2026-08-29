"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { fetchImportHistory, type ImportHistoryEntry } from "@/lib/inventoryData";
import PageStats from "@/components/PageStats";

export default function DataSyncPage() {
  const [history, setHistory] = useState<ImportHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchImportHistory()
      .then(setHistory)
      .finally(() => setLoading(false));
  }, []);

  const totalRows = history.length;
  const lastImport = history[0]?.createdAt;
  const positiveQty = history.filter((h) => h.quantityChange > 0).length;

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
      <h1 className="mb-1 text-2xl font-bold text-slate-900">Data Sync</h1>
      <p className="mb-6 text-sm text-slate-500">
        There&apos;s no live connection to Tally or any external system — imports happen by uploading an
        Excel/CSV export, which is reconciled against existing stock. This is the real log of every import
        committed, not a simulated sync status.
      </p>

      <PageStats
        items={[
          { label: "Import Events Logged", value: String(totalRows) },
          { label: "Batches Created/Updated via Import", value: String(positiveQty) },
          { label: "Last Import", value: lastImport ? new Date(lastImport).toLocaleString() : "Never" },
        ]}
      />

      <div className="mb-4 flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4">
        <p className="text-sm text-slate-600">Upload a new Tally or generic Excel/CSV export to reconcile stock.</p>
        <Link
          href="/inventory/add"
          className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-700"
        >
          Import File
        </Link>
      </div>

      <div className="overflow-auto rounded-lg border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2.5 text-left font-medium text-slate-600">When</th>
              <th className="px-3 py-2.5 text-left font-medium text-slate-600">Product</th>
              <th className="px-3 py-2.5 text-left font-medium text-slate-600">Batch</th>
              <th className="px-3 py-2.5 text-left font-medium text-slate-600">Warehouse</th>
              <th className="px-3 py-2.5 text-right font-medium text-slate-600">Qty Change</th>
              <th className="px-3 py-2.5 text-left font-medium text-slate-600">Note</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {history.map((h) => (
              <tr key={h.id} className="bg-white hover:bg-slate-50">
                <td className="px-3 py-2.5 text-slate-600">{new Date(h.createdAt).toLocaleString()}</td>
                <td className="px-3 py-2.5 font-medium text-slate-800">{h.productName}</td>
                <td className="px-3 py-2.5 text-slate-600">{h.batchNumber}</td>
                <td className="px-3 py-2.5 text-slate-600">{h.warehouseName ?? "—"}</td>
                <td className={`px-3 py-2.5 text-right ${h.quantityChange >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                  {h.quantityChange >= 0 ? "+" : ""}
                  {h.quantityChange}
                </td>
                <td className="px-3 py-2.5 text-slate-500">{h.reference ?? "—"}</td>
              </tr>
            ))}
            {!loading && history.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-sm text-slate-400">
                  No imports recorded yet.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-sm text-slate-400">
                  Loading…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
