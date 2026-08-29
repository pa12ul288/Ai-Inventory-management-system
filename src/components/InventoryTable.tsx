"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import type { InventoryRecord, StockStatus, BatchStatus } from "@/lib/types";
import { formatInr } from "@/lib/format";
import { downloadInventoryCsv } from "@/lib/csvExport";
import { useAppData } from "@/lib/AppDataContext";
import StockStatusBadge from "./StockStatusBadge";
import ExpiryBadge from "./ExpiryBadge";
import BatchStatusBadge from "./BatchStatusBadge";
import { SearchIcon, FilterIcon } from "./icons";

export type FilterValue = "All" | StockStatus | "expiring" | "expired";

const FILTERS: { label: string; value: FilterValue }[] = [
  { label: "All", value: "All" },
  { label: "Out of Stock", value: "out_of_stock" },
  { label: "Low Stock", value: "low_stock" },
  { label: "Expiring Soon", value: "expiring" },
  { label: "Expired", value: "expired" },
  { label: "Overstock", value: "overstock" },
  { label: "Slow Moving", value: "slow_moving" },
];

type SortKey = "product" | "available" | "expiry" | "value";
const PAGE_SIZE = 15;

export default function InventoryTable({
  records,
  initialFilter = "All",
  initialSearch = "",
}: {
  records: InventoryRecord[];
  initialFilter?: FilterValue;
  initialSearch?: string;
}) {
  const { handleUpdateBatchStatuses } = useAppData();
  const [query, setQuery] = useState(initialSearch);
  const [filter, setFilter] = useState<FilterValue>(initialFilter);
  const [sortKey, setSortKey] = useState<SortKey>("expiry");
  const [sortAsc, setSortAsc] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [applyingStatus, setApplyingStatus] = useState(false);
  const [page, setPage] = useState(1);

  const filteredRecords = useMemo(() => {
    const q = query.trim().toLowerCase();
    let result = records.filter((r) => {
      const matchesQuery =
        q === "" ||
        r.productName.toLowerCase().includes(q) ||
        r.sku.toLowerCase().includes(q) ||
        r.batchNumber.toLowerCase().includes(q) ||
        r.supplierName?.toLowerCase().includes(q);
      if (!matchesQuery) return false;

      if (filter === "All") return true;
      if (filter === "expiring") return r.expiryStatus === "expiring_30" || r.expiryStatus === "expiring_60" || r.expiryStatus === "expiring_90";
      if (filter === "expired") return r.expiryStatus === "expired";
      return r.stockStatus === filter;
    });

    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortKey === "product") cmp = a.productName.localeCompare(b.productName);
      if (sortKey === "available") cmp = a.availableQty - b.availableQty;
      if (sortKey === "value") cmp = a.value - b.value;
      if (sortKey === "expiry") cmp = (a.daysToExpiry ?? Infinity) - (b.daysToExpiry ?? Infinity);
      return sortAsc ? cmp : -cmp;
    });

    return result;
  }, [records, query, filter, sortKey, sortAsc]);

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
  const pageRecords = filteredRecords.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortAsc((a) => !a);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  }

  function toggleSelected(batchId: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(batchId)) next.delete(batchId);
      else next.add(batchId);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selected.size === pageRecords.length) setSelected(new Set());
    else setSelected(new Set(pageRecords.map((r) => r.batchId)));
  }

  async function applyBulkStatus(status: BatchStatus) {
    setApplyingStatus(true);
    await handleUpdateBatchStatuses(Array.from(selected), status);
    setApplyingStatus(false);
    setSelected(new Set());
  }

  function exportSelectedOrAll() {
    const toExport = selected.size > 0 ? filteredRecords.filter((r) => selected.has(r.batchId)) : filteredRecords;
    downloadInventoryCsv(toExport, "inventory-export.csv");
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-semibold text-slate-900">Inventory ({filteredRecords.length})</h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search product, SKU, or batch…"
              className="w-64 rounded-lg border border-slate-300 bg-white py-1.5 pl-8 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-teal-500 focus:outline-none focus:ring-1 focus:ring-teal-500"
            />
          </div>
          <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-slate-300 bg-white p-1">
            <FilterIcon className="ml-1 h-3.5 w-3.5 text-slate-400" />
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => {
                  setFilter(f.value);
                  setPage(1);
                }}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  filter === f.value ? "bg-teal-600 text-white" : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <button
            onClick={exportSelectedOrAll}
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Download {selected.size > 0 ? `Selected (${selected.size})` : "All"}
          </button>
        </div>
      </div>

      {selected.size > 0 && (
        <div className="mb-3 flex flex-wrap items-center gap-2 rounded-lg bg-teal-50 px-3 py-2 text-sm text-teal-800">
          <span className="font-medium">{selected.size} selected</span>
          <span className="text-teal-400">·</span>
          <span>Set status:</span>
          {(["quarantined", "damaged", "written_off", "active"] as BatchStatus[]).map((status) => (
            <button
              key={status}
              disabled={applyingStatus}
              onClick={() => applyBulkStatus(status)}
              className="rounded-md border border-teal-200 bg-white px-2.5 py-1 text-xs font-medium text-teal-700 hover:bg-teal-100 disabled:opacity-50"
            >
              {status.replace("_", " ")}
            </button>
          ))}
        </div>
      )}

      <div className="overflow-auto rounded-lg border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="w-10 px-3 py-2.5">
                <input
                  type="checkbox"
                  checked={pageRecords.length > 0 && selected.size === pageRecords.length}
                  onChange={toggleSelectAll}
                  className="rounded border-slate-300"
                />
              </th>
              <SortableHeader label="Product" active={sortKey === "product"} asc={sortAsc} onClick={() => toggleSort("product")} />
              <th className="px-3 py-2.5 text-left font-medium text-slate-600">Batch</th>
              <th className="px-3 py-2.5 text-left font-medium text-slate-600">Warehouse</th>
              <SortableHeader label="Available" align="right" active={sortKey === "available"} asc={sortAsc} onClick={() => toggleSort("available")} />
              <SortableHeader label="Expiry" active={sortKey === "expiry"} asc={sortAsc} onClick={() => toggleSort("expiry")} />
              <SortableHeader label="Value (₹)" align="right" active={sortKey === "value"} asc={sortAsc} onClick={() => toggleSort("value")} />
              <th className="px-3 py-2.5 text-left font-medium text-slate-600">Status</th>
              <th className="px-3 py-2.5 text-left font-medium text-slate-600">Batch Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pageRecords.map((r) => (
              <tr key={r.batchId} className="bg-white hover:bg-slate-50">
                <td className="px-3 py-2.5">
                  <input
                    type="checkbox"
                    checked={selected.has(r.batchId)}
                    onChange={() => toggleSelected(r.batchId)}
                    className="rounded border-slate-300"
                  />
                </td>
                <td className="px-3 py-2.5">
                  <Link href={`/inventory/${r.productId}`} className="font-medium text-slate-800 hover:text-teal-700 hover:underline">
                    {r.productName}
                  </Link>
                  <p className="text-xs text-slate-400">{r.sku || "No SKU"}</p>
                </td>
                <td className="px-3 py-2.5 text-slate-600">{r.batchNumber}</td>
                <td className="px-3 py-2.5 text-slate-600">{r.warehouseName}</td>
                <td className="px-3 py-2.5 text-right text-slate-800">{r.availableQty}</td>
                <td className="px-3 py-2.5">
                  <ExpiryBadge status={r.expiryStatus} daysToExpiry={r.daysToExpiry} />
                </td>
                <td className="px-3 py-2.5 text-right text-slate-800">{formatInr(r.value)}</td>
                <td className="px-3 py-2.5">
                  <StockStatusBadge status={r.stockStatus} />
                </td>
                <td className="px-3 py-2.5">
                  <BatchStatusBadge status={r.status} />
                </td>
              </tr>
            ))}
            {pageRecords.length === 0 && (
              <tr>
                <td colSpan={9} className="px-3 py-6 text-center text-sm text-slate-400">
                  No batches match your search or filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {filteredRecords.length > 0 && (
        <div className="mt-3 flex items-center justify-between text-sm text-slate-500">
          <p>
            Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filteredRecords.length)} of{" "}
            {filteredRecords.length}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Previous
            </button>
            <span className="text-xs text-slate-400">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SortableHeader({
  label,
  active,
  asc,
  onClick,
  align = "left",
}: {
  label: string;
  active: boolean;
  asc: boolean;
  onClick: () => void;
  align?: "left" | "right";
}) {
  return (
    <th
      onClick={onClick}
      className={`cursor-pointer select-none px-3 py-2.5 font-medium text-slate-600 hover:text-slate-900 ${
        align === "right" ? "text-right" : "text-left"
      }`}
    >
      {label}
      {active && <span className="ml-1 text-teal-600">{asc ? "↑" : "↓"}</span>}
    </th>
  );
}
