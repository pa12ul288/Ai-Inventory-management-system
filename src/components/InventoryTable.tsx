"use client";

import { useMemo, useState } from "react";
import type { ClassifiedInventoryRow, Classification } from "@/lib/types";
import { formatInr } from "@/lib/format";
import ClassificationBadge from "./ClassificationBadge";
import ExpiryBadge from "./ExpiryBadge";
import { SearchIcon, FilterIcon } from "./icons";

const FILTERS: { label: string; value: Classification | "All" }[] = [
  { label: "All", value: "All" },
  { label: "Sell Off", value: "Sell off" },
  { label: "Watch", value: "Watch" },
  { label: "Keep & Reorder", value: "Keep & Reorder" },
];

export default function InventoryTable({ rows }: { rows: ClassifiedInventoryRow[] }) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Classification | "All">("All");

  const filteredRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      const matchesQuery = q === "" || r.productName.toLowerCase().includes(q);
      const matchesFilter = filter === "All" || r.classification === filter;
      return matchesQuery && matchesFilter;
    });
  }, [rows, query, filter]);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold text-slate-900">Full Inventory ({filteredRows.length})</h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products…"
              className="w-52 rounded-lg border border-slate-300 bg-white py-1.5 pl-8 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
          <div className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white p-1">
            <FilterIcon className="ml-1 h-3.5 w-3.5 text-slate-400" />
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  filter === f.value
                    ? "bg-teal-600 text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-h-[32rem] overflow-auto rounded-lg border border-slate-100">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="sticky top-0 z-10 bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-slate-600">Product Name</th>
              <th className="px-3 py-2 text-right font-medium text-slate-600">Stock Quantity</th>
              <th className="px-3 py-2 text-right font-medium text-slate-600">Value (₹)</th>
              <th className="px-3 py-2 text-right font-medium text-slate-600">Days in Stock</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">AI Recommendation</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">Expiry</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRows.map((r, i) => (
              <tr key={r.id} className={`${i % 2 === 1 ? "bg-slate-50/60" : "bg-white"} hover:bg-teal-50/60`}>
                <td className="px-3 py-2 text-slate-800">{r.productName}</td>
                <td className="px-3 py-2 text-right text-slate-800">{r.quantityOnHand}</td>
                <td className="px-3 py-2 text-right text-slate-800">{formatInr(r.value)}</td>
                <td className="px-3 py-2 text-right text-slate-500">{r.daysInStock ?? "—"}</td>
                <td className="px-3 py-2">
                  <ClassificationBadge classification={r.classification} />
                </td>
                <td className="px-3 py-2">
                  <ExpiryBadge status={r.expiryStatus} daysToExpiry={r.daysToExpiry} />
                </td>
              </tr>
            ))}
            {filteredRows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-sm text-slate-400">
                  No products match your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
