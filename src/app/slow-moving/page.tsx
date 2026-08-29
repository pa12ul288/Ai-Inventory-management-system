"use client";

import { useMemo } from "react";
import { useAppData } from "@/lib/AppDataContext";
import PageStats from "@/components/PageStats";
import InventoryTable from "@/components/InventoryTable";
import { formatInr } from "@/lib/format";

export default function SlowMovingPage() {
  const { records } = useAppData();

  const slowMoving = useMemo(() => records.filter((r) => r.stockStatus === "slow_moving"), [records]);
  const overstock = useMemo(() => records.filter((r) => r.stockStatus === "overstock"), [records]);

  const slowValue = slowMoving.reduce((s, r) => s + r.value, 0);
  const overstockValue = overstock.reduce((s, r) => s + r.value, 0);

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
      <h1 className="mb-1 text-2xl font-bold text-slate-900">Slow-Moving Stock</h1>
      <p className="mb-6 text-sm text-slate-500">
        Batches with zero recorded sales, plus stock well beyond 180 days of cover at the current sales rate.
      </p>

      <PageStats
        items={[
          { label: "Slow-Moving Batches", value: String(slowMoving.length) },
          { label: "Capital Idle (Slow-Moving)", value: formatInr(slowValue), accent: slowValue > 0 ? "text-indigo-600" : undefined },
          { label: "Overstocked Batches", value: String(overstock.length) },
          { label: "Capital Idle (Overstock)", value: formatInr(overstockValue), accent: overstockValue > 0 ? "text-indigo-600" : undefined },
        ]}
      />

      <h2 className="mb-3 text-sm font-semibold text-slate-900">Zero Recorded Sales</h2>
      <div className="mb-8">
        <InventoryTable records={slowMoving} initialFilter="All" />
      </div>

      <h2 className="mb-3 text-sm font-semibold text-slate-900">Overstocked (180+ Days of Cover)</h2>
      <InventoryTable records={overstock} initialFilter="All" />

      <p className="mt-4 text-xs text-slate-400">
        &quot;Zero recorded sales&quot; means the product&apos;s average daily sales figure is 0 — either it truly
        hasn&apos;t sold, or sales haven&apos;t been recorded against it yet.
      </p>
    </div>
  );
}
