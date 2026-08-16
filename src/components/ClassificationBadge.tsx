import type { Classification } from "@/lib/types";

const STYLES: Record<Classification, string> = {
  "Sell off": "bg-red-50 text-red-700 ring-1 ring-inset ring-red-200",
  Watch: "bg-amber-50 text-amber-700 ring-1 ring-inset ring-amber-200",
  "Keep & Reorder": "bg-green-50 text-green-700 ring-1 ring-inset ring-green-200",
};

const DOT_STYLES: Record<Classification, string> = {
  "Sell off": "bg-red-500",
  Watch: "bg-amber-500",
  "Keep & Reorder": "bg-green-500",
};

/** Display label per PRD 4.2 — the Sell Off panel calls the "Sell off"
 * classification "Sell Now"; everywhere else uses the classification as-is. */
export function displayLabel(classification: Classification, context: "sellOffPanel" | "default" = "default") {
  if (context === "sellOffPanel" && classification === "Sell off") return "Sell Now";
  return classification;
}

export default function ClassificationBadge({
  classification,
  context = "default",
}: {
  classification: Classification;
  context?: "sellOffPanel" | "default";
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${STYLES[classification]}`}
    >
      <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${DOT_STYLES[classification]}`} />
      {displayLabel(classification, context)}
    </span>
  );
}
