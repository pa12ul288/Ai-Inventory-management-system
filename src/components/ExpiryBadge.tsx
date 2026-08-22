import type { ExpiryStatus } from "@/lib/expiry";

const STYLES: Record<ExpiryStatus, string> = {
  expired: "bg-red-100 text-red-800 ring-1 ring-inset ring-red-300",
  "expiring-soon": "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  ok: "bg-slate-50 text-slate-500 ring-1 ring-inset ring-slate-200",
  unknown: "bg-slate-50 text-slate-400 ring-1 ring-inset ring-slate-200",
};

const LABELS: Record<ExpiryStatus, (daysToExpiry: number | null) => string> = {
  expired: (d) => (d !== null ? `Expired ${Math.abs(d)}d ago` : "Expired"),
  "expiring-soon": (d) => (d !== null ? `Expires in ${d}d` : "Expiring soon"),
  ok: (d) => (d !== null ? `Expires in ${d}d` : "OK"),
  unknown: () => "No expiry data",
};

export default function ExpiryBadge({
  status,
  daysToExpiry,
}: {
  status: ExpiryStatus;
  daysToExpiry: number | null;
}) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${STYLES[status]}`}>
      {LABELS[status](daysToExpiry)}
    </span>
  );
}
