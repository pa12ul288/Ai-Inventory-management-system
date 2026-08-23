import type { StockStatus } from "@/lib/types";

const STYLES: Record<StockStatus, string> = {
  out_of_stock: "bg-red-100 text-red-800 ring-1 ring-inset ring-red-300",
  low_stock: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  overstock: "bg-indigo-50 text-indigo-700 ring-1 ring-inset ring-indigo-200",
  slow_moving: "bg-slate-100 text-slate-600 ring-1 ring-inset ring-slate-200",
  healthy: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
};

const LABELS: Record<StockStatus, string> = {
  out_of_stock: "Out of Stock",
  low_stock: "Low Stock",
  overstock: "Overstock",
  slow_moving: "Slow Moving",
  healthy: "Healthy",
};

export default function StockStatusBadge({ status }: { status: StockStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${STYLES[status]}`}>
      {LABELS[status]}
    </span>
  );
}
