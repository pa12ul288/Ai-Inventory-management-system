import type { BatchStatus } from "@/lib/types";
import { batchStatusLabel } from "@/lib/stockStatus";

const STYLES: Record<BatchStatus, string> = {
  active: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-200",
  quarantined: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  damaged: "bg-orange-50 text-orange-700 ring-1 ring-inset ring-orange-200",
  expired: "bg-red-100 text-red-800 ring-1 ring-inset ring-red-300",
  written_off: "bg-slate-100 text-slate-500 ring-1 ring-inset ring-slate-200",
};

export default function BatchStatusBadge({ status }: { status: BatchStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${STYLES[status]}`}>
      {batchStatusLabel(status)}
    </span>
  );
}
