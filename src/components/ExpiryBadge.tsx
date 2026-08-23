import type { ExpiryStatus } from "@/lib/types";

const STYLES: Record<ExpiryStatus, string> = {
  expired: "bg-red-100 text-red-800 ring-1 ring-inset ring-red-300",
  expiring_30: "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
  expiring_60: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  expiring_90: "bg-amber-50 text-amber-600 ring-1 ring-inset ring-amber-100",
  healthy: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  unknown: "bg-slate-50 text-slate-400 ring-1 ring-inset ring-slate-200",
};

const LABELS: Record<ExpiryStatus, (d: number | null) => string> = {
  expired: (d) => (d !== null ? `Expired ${Math.abs(d)}d ago` : "Expired"),
  expiring_30: (d) => `${d}d left`,
  expiring_60: (d) => `${d}d left`,
  expiring_90: (d) => `${d}d left`,
  healthy: () => "Healthy",
  unknown: () => "No expiry data",
};

export default function ExpiryBadge({ status, daysToExpiry }: { status: ExpiryStatus; daysToExpiry: number | null }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${STYLES[status]}`}>
      {LABELS[status](daysToExpiry)}
    </span>
  );
}
