import type { ClassifiedInventoryRow } from "@/lib/types";
import { formatInr } from "@/lib/format";
import ClassificationBadge from "./ClassificationBadge";

export default function KeepReorderList({ rows }: { rows: ClassifiedInventoryRow[] }) {
  const items = rows
    .filter((r) => r.classification === "Keep & Reorder")
    .sort((a, b) => (a.daysInStock ?? Infinity) - (b.daysInStock ?? Infinity));

  return (
    <div className="h-full rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 font-semibold text-slate-900">Keep &amp; Reorder</h2>
      {items.length === 0 ? (
        <p className="text-sm text-slate-400">Nothing urgent to reorder right now.</p>
      ) : (
        <div className="max-h-96 divide-y divide-slate-100 overflow-auto">
          {items.map((r) => (
            <div key={r.id} className="flex items-center justify-between gap-3 py-2.5">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-800">{r.productName}</p>
                <p className="text-xs text-slate-500">
                  {r.daysInStock !== null ? `${r.daysInStock} days on hand` : "No sale data"} ·{" "}
                  {formatInr(r.value)} locked
                </p>
              </div>
              <ClassificationBadge classification={r.classification} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
