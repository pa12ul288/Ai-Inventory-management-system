import type { Classification } from "@/lib/types";

const STYLES: Record<Classification, string> = {
  "Sell off": "bg-red-100 text-red-700",
  Watch: "bg-amber-100 text-amber-700",
  "Keep & Reorder": "bg-emerald-100 text-emerald-700",
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
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLES[classification]}`}>
      {displayLabel(classification, context)}
    </span>
  );
}
