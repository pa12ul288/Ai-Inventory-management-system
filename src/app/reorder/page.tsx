"use client";

import { useAppData } from "@/lib/AppDataContext";
import KeepReorderList from "@/components/KeepReorderList";
import PageStats from "@/components/PageStats";
import { formatInr } from "@/lib/format";

export default function ReorderPage() {
  const { rows, kpis } = useAppData();

  const reorderRows = rows.filter((r) => r.classification === "Keep & Reorder");
  const mostUrgentDays =
    reorderRows.length > 0 ? Math.min(...reorderRows.map((r) => r.daysInStock ?? Infinity)) : null;

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Reorder</h1>
      <PageStats
        items={[
          { label: "To Reorder", value: String(reorderRows.length), accent: "text-emerald-600" },
          { label: "Cash Needed", value: formatInr(kpis.cashNeededToReorder), accent: "text-teal-600" },
          {
            label: "Most Urgent",
            value: mostUrgentDays !== null && Number.isFinite(mostUrgentDays) ? `${mostUrgentDays} days` : "—",
            accent: "text-amber-600",
          },
        ]}
      />
      <KeepReorderList rows={rows} />
    </div>
  );
}
