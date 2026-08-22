"use client";

import { useAppData } from "@/lib/AppDataContext";
import InventoryTable from "@/components/InventoryTable";
import PageStats from "@/components/PageStats";
import { formatInr } from "@/lib/format";

export default function InventoryPage() {
  const { rows, kpis } = useAppData();

  const sellOffCount = rows.filter((r) => r.classification === "Sell off").length;
  const reorderCount = rows.filter((r) => r.classification === "Keep & Reorder").length;

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Inventory</h1>
      <PageStats
        items={[
          { label: "Total SKUs", value: String(rows.length) },
          { label: "Total Value", value: formatInr(kpis.totalInventoryValue) },
          { label: "Sell Off", value: String(sellOffCount), accent: "text-red-600" },
          { label: "Keep & Reorder", value: String(reorderCount), accent: "text-emerald-600" },
        ]}
      />
      <InventoryTable rows={rows} />
    </div>
  );
}
