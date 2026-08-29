"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useAppData } from "@/lib/AppDataContext";
import PageStats from "@/components/PageStats";
import { formatInr } from "@/lib/format";

interface WarehouseRow {
  id: string;
  name: string;
  location: string | null;
  batches: number;
  units: number;
  value: number;
  outOfStock: number;
  lowStock: number;
  overstock: number;
  slowMoving: number;
}

export default function WarehousePage() {
  const { records, warehouses } = useAppData();

  const rows = useMemo(() => {
    const map = new Map<string, WarehouseRow>();

    for (const w of warehouses) {
      map.set(w.id, { id: w.id, name: w.name, location: w.location, batches: 0, units: 0, value: 0, outOfStock: 0, lowStock: 0, overstock: 0, slowMoving: 0 });
    }

    for (const r of records) {
      let row = map.get(r.warehouseId);
      if (!row) {
        row = { id: r.warehouseId, name: r.warehouseName, location: null, batches: 0, units: 0, value: 0, outOfStock: 0, lowStock: 0, overstock: 0, slowMoving: 0 };
        map.set(r.warehouseId, row);
      }
      row.batches += 1;
      row.units += r.availableQty;
      row.value += r.value;
      if (r.stockStatus === "out_of_stock") row.outOfStock += 1;
      if (r.stockStatus === "low_stock") row.lowStock += 1;
      if (r.stockStatus === "overstock") row.overstock += 1;
      if (r.stockStatus === "slow_moving") row.slowMoving += 1;
    }

    return Array.from(map.values()).sort((a, b) => b.value - a.value);
  }, [records, warehouses]);

  const totalValue = rows.reduce((sum, r) => sum + r.value, 0);
  const totalUnits = rows.reduce((sum, r) => sum + r.units, 0);
  const totalOverstock = rows.reduce((sum, r) => sum + r.overstock, 0);
  const totalSlowMoving = rows.reduce((sum, r) => sum + r.slowMoving, 0);

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="mb-1 text-2xl font-bold text-slate-900">Warehouse</h1>
      <p className="mb-6 text-sm text-slate-500">Value and stock health by location.</p>

      <PageStats
        items={[
          { label: "Warehouses", value: String(rows.length) },
          { label: "Total Value", value: formatInr(totalValue) },
          { label: "Total Units", value: String(totalUnits) },
          { label: "Overstock / Slow-Moving Batches", value: String(totalOverstock + totalSlowMoving), accent: "text-indigo-600" },
        ]}
      />

      <div className="flex flex-col gap-4">
        {rows.map((r) => (
          <div key={r.id} className="rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/40 p-5">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h2 className="font-semibold text-slate-900">{r.name}</h2>
                {r.location && <p className="text-xs text-slate-400">{r.location}</p>}
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-slate-900">{formatInr(r.value)}</p>
                <p className="text-xs text-slate-400">{r.units} units · {r.batches} batches</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {r.outOfStock > 0 && (
                <Link href={`/inventory?filter=out_of_stock`} className="rounded-full border border-red-200 bg-red-50 px-3 py-1 text-xs font-medium text-red-700 hover:opacity-80">
                  {r.outOfStock} out of stock
                </Link>
              )}
              {r.lowStock > 0 && (
                <Link href={`/inventory?filter=low_stock`} className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 hover:opacity-80">
                  {r.lowStock} low stock
                </Link>
              )}
              {r.overstock > 0 && (
                <Link href={`/inventory?filter=overstock`} className="rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 hover:opacity-80">
                  {r.overstock} overstock
                </Link>
              )}
              {r.slowMoving > 0 && (
                <Link href={`/inventory?filter=slow_moving`} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600 hover:opacity-80">
                  {r.slowMoving} slow moving
                </Link>
              )}
              {r.outOfStock === 0 && r.lowStock === 0 && r.overstock === 0 && r.slowMoving === 0 && (
                <span className="text-xs text-slate-400">Nothing needs attention in this warehouse.</span>
              )}
            </div>
          </div>
        ))}

        {rows.length === 0 && (
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/40 p-6 text-center text-sm text-slate-400">
            No warehouses yet — they&apos;re created automatically the first time you add inventory to one.
          </div>
        )}
      </div>

      <p className="mt-4 text-xs text-slate-400">
        Physical capacity (sq ft) isn&apos;t tracked yet, so this shows value and stock-health by warehouse rather
        than space utilization. Let me know if you want capacity fields added per warehouse.
      </p>
    </div>
  );
}
