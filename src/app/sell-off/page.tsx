"use client";

import { useAppData } from "@/lib/AppDataContext";
import SellOffList from "@/components/SellOffList";
import PageStats from "@/components/PageStats";
import { formatInr } from "@/lib/format";

export default function SellOffPage() {
  const { rows, kpis } = useAppData();

  const sellOffRows = rows.filter((r) => r.classification === "Sell off");
  const watchRows = rows.filter((r) => r.classification === "Watch");
  const oldestUnsold = Math.max(0, ...sellOffRows.map((r) => r.daysInStock ?? 0));

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Sell Off</h1>
      <PageStats
        items={[
          { label: "To Sell Off", value: String(sellOffRows.length), accent: "text-red-600" },
          { label: "Value Locked", value: formatInr(kpis.slowDeadStockValue), accent: "text-red-600" },
          { label: "Watching", value: String(watchRows.length), accent: "text-amber-600" },
          { label: "Oldest Unsold", value: oldestUnsold > 0 ? `${oldestUnsold} days` : "—" },
        ]}
      />
      <SellOffList rows={rows} />
    </div>
  );
}
