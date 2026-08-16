import type { ClassifiedInventoryRow } from "@/lib/types";
import { formatInr } from "@/lib/format";

interface FilterModalProps {
  title: string;
  rows: ClassifiedInventoryRow[];
  mode: "sellOff" | "reorder";
  onClose: () => void;
}

export default function FilterModal({ title, rows, mode, onClose }: FilterModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <div
        className="max-h-[80vh] w-full max-w-2xl overflow-hidden rounded-xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600" aria-label="Close">
            ✕
          </button>
        </div>
        <div className="max-h-[65vh] overflow-auto p-5">
          {rows.length === 0 ? (
            <p className="text-sm text-slate-400">No products match this filter.</p>
          ) : (
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-slate-600">Product</th>
                  {mode === "sellOff" ? (
                    <th className="px-3 py-2 text-right font-medium text-slate-600">Value Locked (₹)</th>
                  ) : (
                    <th className="px-3 py-2 text-right font-medium text-slate-600">Days to Sell Out</th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="px-3 py-2 text-slate-800">{r.productName}</td>
                    {mode === "sellOff" ? (
                      <td className="px-3 py-2 text-right text-slate-800">{formatInr(r.value)}</td>
                    ) : (
                      <td className="px-3 py-2 text-right text-slate-800">
                        {r.daysOnHand !== null ? r.daysOnHand.toFixed(1) : "—"}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
