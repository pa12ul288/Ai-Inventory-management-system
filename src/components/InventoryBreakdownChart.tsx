import type { ClassifiedInventoryRow } from "@/lib/types";
import { formatInr } from "@/lib/format";

interface Segment {
  label: string;
  value: number;
  color: string; // stroke color
  dot: string; // legend dot bg class
  text: string; // legend value text class
}

const RADIUS = 60;
const STROKE = 18;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function InventoryBreakdownChart({ rows }: { rows: ClassifiedInventoryRow[] }) {
  const sellOffValue = rows.filter((r) => r.classification === "Sell off").reduce((s, r) => s + r.value, 0);
  const watchValue = rows.filter((r) => r.classification === "Watch").reduce((s, r) => s + r.value, 0);
  const reorderValue = rows.filter((r) => r.classification === "Keep & Reorder").reduce((s, r) => s + r.value, 0);
  const total = sellOffValue + watchValue + reorderValue;

  const segments: Segment[] = [
    { label: "Keep & Reorder", value: reorderValue, color: "#0d9488", dot: "bg-teal-600", text: "text-teal-700" },
    { label: "Watch", value: watchValue, color: "#d97706", dot: "bg-amber-500", text: "text-amber-700" },
    { label: "Sell Off", value: sellOffValue, color: "#dc2626", dot: "bg-red-600", text: "text-red-700" },
  ];

  const healthScore = total > 0 ? Math.round(((total - sellOffValue) / total) * 100) : 0;
  const healthLabel = healthScore >= 80 ? "Healthy" : healthScore >= 50 ? "Watch closely" : "At risk";
  const healthColor = healthScore >= 80 ? "text-teal-600" : healthScore >= 50 ? "text-amber-600" : "text-red-600";

  let cumulative = 0;

  return (
    <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <h2 className="mb-4 font-semibold text-slate-900">Portfolio Health</h2>
      <div className="flex flex-1 items-center gap-6">
        <div className="relative shrink-0">
          <svg width="150" height="150" viewBox="0 0 150 150" className="-rotate-90">
            <circle cx="75" cy="75" r={RADIUS} fill="none" stroke="#f1f5f9" strokeWidth={STROKE} />
            {total > 0 &&
              segments
                .filter((s) => s.value > 0)
                .map((s) => {
                  const length = (s.value / total) * CIRCUMFERENCE;
                  const offset = -cumulative;
                  cumulative += length;
                  return (
                    <circle
                      key={s.label}
                      cx="75"
                      cy="75"
                      r={RADIUS}
                      fill="none"
                      stroke={s.color}
                      strokeWidth={STROKE}
                      strokeDasharray={`${length} ${CIRCUMFERENCE - length}`}
                      strokeDashoffset={offset}
                      strokeLinecap="butt"
                    />
                  );
                })}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-2xl font-bold ${healthColor}`}>{healthScore}%</span>
            <span className="text-xs text-slate-400">{healthLabel}</span>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-2.5">
          {segments.map((s) => (
            <div key={s.label} className="flex items-center justify-between gap-2 text-sm">
              <span className="flex items-center gap-2 text-slate-600">
                <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${s.dot}`} />
                {s.label}
              </span>
              <span className={`font-medium ${s.text}`}>{formatInr(s.value)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
