import type { ClassifiedInventoryRow } from "@/lib/types";
import { formatInr } from "@/lib/format";
import ClassificationBadge from "./ClassificationBadge";

export default function InventoryTable({ rows }: { rows: ClassifiedInventoryRow[] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 font-semibold text-slate-900">Full Inventory ({rows.length})</h2>
      <div className="max-h-[32rem] overflow-auto rounded-lg border border-slate-100">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="sticky top-0 bg-slate-50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-slate-600">Product Name</th>
              <th className="px-3 py-2 text-right font-medium text-slate-600">Stock Quantity</th>
              <th className="px-3 py-2 text-right font-medium text-slate-600">Value (₹)</th>
              <th className="px-3 py-2 text-right font-medium text-slate-600">Days in Stock</th>
              <th className="px-3 py-2 text-left font-medium text-slate-600">AI Recommendation</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-slate-50">
                <td className="px-3 py-2 text-slate-800">{r.productName}</td>
                <td className="px-3 py-2 text-right text-slate-800">{r.quantityOnHand}</td>
                <td className="px-3 py-2 text-right text-slate-800">{formatInr(r.value)}</td>
                <td className="px-3 py-2 text-right text-slate-500">{r.daysInStock ?? "—"}</td>
                <td className="px-3 py-2">
                  <ClassificationBadge classification={r.classification} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
