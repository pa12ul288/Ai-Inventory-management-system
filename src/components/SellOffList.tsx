import Link from "next/link";
import type { ClassifiedInventoryRow } from "@/lib/types";
import { formatInr } from "@/lib/format";
import ClassificationBadge from "./ClassificationBadge";

interface SellOffListProps {
  rows: ClassifiedInventoryRow[];
  /** Cap the list and show a "View all" link — used for the dashboard preview. */
  limit?: number;
}

export default function SellOffList({ rows, limit }: SellOffListProps) {
  const allItems = rows
    .filter((r) => r.classification === "Sell off" || r.classification === "Watch")
    .sort((a, b) => (b.daysInStock ?? 0) - (a.daysInStock ?? 0));
  const items = limit ? allItems.slice(0, limit) : allItems;

  return (
    <div className="h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-semibold text-slate-900">Sell Off</h2>
        {limit && allItems.length > limit && (
          <Link href="/sell-off" className="text-xs font-medium text-teal-700 hover:text-teal-800">
            View all ({allItems.length})
          </Link>
        )}
      </div>
      {items.length === 0 ? (
        <p className="text-sm text-slate-400">Nothing to clear right now.</p>
      ) : (
        <div className={`divide-y divide-slate-100 ${limit ? "max-h-96 overflow-auto" : ""}`}>
          {items.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-800">{r.productName}</p>
                <p className="text-xs text-slate-500">
                  {r.daysInStock !== null ? `${r.daysInStock} days unsold` : "No sale data"} ·{" "}
                  {formatInr(r.value)} locked
                </p>
              </div>
              <ClassificationBadge classification={r.classification} context="sellOffPanel" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
