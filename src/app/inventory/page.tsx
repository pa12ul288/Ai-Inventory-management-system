"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAppData } from "@/lib/AppDataContext";
import InventoryTable, { type FilterValue } from "@/components/InventoryTable";
import PageStats from "@/components/PageStats";
import { formatInr } from "@/lib/format";

const VALID_FILTERS: FilterValue[] = [
  "All",
  "out_of_stock",
  "low_stock",
  "overstock",
  "slow_moving",
  "healthy",
  "expiring",
  "expired",
];

export default function InventoryPage() {
  const { records, kpis } = useAppData();
  const searchParams = useSearchParams();
  const requestedFilter = searchParams.get("filter");
  const initialFilter: FilterValue = VALID_FILTERS.includes(requestedFilter as FilterValue)
    ? (requestedFilter as FilterValue)
    : "All";
  const initialSearch = searchParams.get("search") ?? "";

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Inventory</h1>
        <Link
          href="/inventory/add"
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
        >
          Add Inventory
        </Link>
      </div>
      <PageStats
        items={[
          { label: "Total SKUs", value: String(kpis.totalSkus), subtitle: "All warehouses" },
          { label: "Total Value", value: formatInr(kpis.totalInventoryValue), subtitle: "Current" },
          { label: "Low Stock", value: String(kpis.lowStockCount), accent: "text-amber-600", subtitle: "At/below reorder point" },
          { label: "Out of Stock", value: String(kpis.outOfStockCount), accent: "text-red-600", subtitle: "Needs restock" },
        ]}
      />
      <InventoryTable
        key={`${initialFilter}-${initialSearch}`}
        records={records}
        initialFilter={initialFilter}
        initialSearch={initialSearch}
      />
    </div>
  );
}
