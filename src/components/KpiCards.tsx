import type { DashboardKpis } from "@/lib/types";
import { formatInr } from "@/lib/format";
import { WalletIcon, AlertTriangleIcon, CartIcon, TrendingDownIcon } from "./icons";

export default function KpiCards({ kpis }: { kpis: DashboardKpis }) {
  const cards = [
    {
      label: "Total Inventory Value",
      value: formatInr(kpis.totalInventoryValue),
      accent: "text-slate-900",
      icon: WalletIcon,
      iconBg: "bg-slate-100 text-slate-600",
    },
    {
      label: "Slow / Dead Stock Value",
      value: formatInr(kpis.slowDeadStockValue),
      accent: "text-red-600",
      icon: AlertTriangleIcon,
      iconBg: "bg-red-50 text-red-600",
    },
    {
      label: "Products to Reorder",
      value: String(kpis.productsToReorder),
      accent: "text-emerald-600",
      icon: CartIcon,
      iconBg: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Capital You Can Free Up",
      value: formatInr(kpis.capitalToFreeUp),
      accent: "text-teal-600",
      icon: TrendingDownIcon,
      iconBg: "bg-teal-50 text-teal-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-3">
            <p className="text-sm font-medium text-slate-500">{card.label}</p>
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${card.iconBg}`}>
              <card.icon className="h-5 w-5" />
            </span>
          </div>
          <p className={`mt-3 text-2xl font-bold ${card.accent}`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
}
