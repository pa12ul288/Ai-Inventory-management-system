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

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-slate-900">Inventory</h1>
        <Link
          href="/inventory/add"
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700"
        >
          Add Inventory
        </Link>
      </div>
      <PageStats
        items={[
          { label: "Total SKUs", value: String(kpis.totalSkus) },
          { label: "Total Value", value: formatInr(kpis.totalInventoryValue) },
          { label: "Low Stock", value: String(kpis.lowStockCount), accent: "text-amber-600" },
          { label: "Out of Stock", value: String(kpis.outOfStockCount), accent: "text-red-600" },
        ]}
      />
      <InventoryTable records={records} initialFilter={initialFilter} />
    </div>
  );
}
