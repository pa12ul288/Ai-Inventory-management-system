import type { DashboardKpis } from "@/lib/types";
import { formatInr } from "@/lib/format";
import { WalletIcon, AlertTriangleIcon, CartIcon, TrendingDownIcon, ExpiryIcon } from "./icons";

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
    {
      label: "Cash Needed to Reorder",
      value: formatInr(kpis.cashNeededToReorder),
      accent: "text-slate-900",
      icon: CartIcon,
      iconBg: "bg-slate-100 text-slate-600",
    },
    {
      label: "Expiring Soon (≤60 days)",
      value: `${kpis.expiringSoonCount + kpis.expiredCount} · ${formatInr(kpis.expiringSoonValue + kpis.expiredValue)}`,
      accent: kpis.expiredValue > 0 ? "text-red-600" : "text-amber-600",
      icon: ExpiryIcon,
      iconBg: kpis.expiredValue > 0 ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
