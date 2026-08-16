import type { DashboardKpis } from "@/lib/types";
import { formatInr } from "@/lib/format";

export default function KpiCards({ kpis }: { kpis: DashboardKpis }) {
  const cards = [
    { label: "Total Inventory Value", value: formatInr(kpis.totalInventoryValue), accent: "text-slate-900" },
    { label: "Slow / Dead Stock Value", value: formatInr(kpis.slowDeadStockValue), accent: "text-red-600" },
    { label: "Products to Reorder", value: String(kpis.productsToReorder), accent: "text-emerald-600" },
    { label: "Capital You Can Free Up", value: formatInr(kpis.capitalToFreeUp), accent: "text-teal-600" },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">{card.label}</p>
          <p className={`mt-2 text-2xl font-bold ${card.accent}`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
}
