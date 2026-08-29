"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useAppData } from "@/lib/AppDataContext";
import { formatInr } from "@/lib/format";
import type { FilterValue } from "@/components/InventoryTable";

interface Rec {
  title: string;
  detail: string;
  impact?: string;
  filter: FilterValue;
  href?: string;
  tone: "red" | "amber" | "indigo";
}

export default function AIRecommendationsPage() {
  const { records } = useAppData();

  const { critical, high, optimization } = useMemo(() => {
    const outOfStock = records.filter((r) => r.stockStatus === "out_of_stock");
    const expired = records.filter((r) => r.expiryStatus === "expired");
    const lowStock = records.filter((r) => r.stockStatus === "low_stock");
    const expiringSoon = records.filter(
      (r) => r.expiryStatus === "expiring_30" || r.expiryStatus === "expiring_60" || r.expiryStatus === "expiring_90"
    );
    const overstock = records.filter((r) => r.stockStatus === "overstock");
    const slowMoving = records.filter((r) => r.stockStatus === "slow_moving");

    const critical: Rec[] = [];
    if (outOfStock.length > 0) {
      critical.push({
        title: `${outOfStock.length} product${outOfStock.length === 1 ? "" : "s"} out of stock`,
        detail: "Zero available quantity right now. Every day out of stock is a lost sale.",
        filter: "out_of_stock",
        tone: "red",
      });
    }
    if (expired.length > 0) {
      const value = expired.reduce((s, r) => s + r.value, 0);
      critical.push({
        title: `${expired.length} batch${expired.length === 1 ? "" : "es"} already expired`,
        detail: "Can no longer be legally sold. Write off, return to supplier, or dispose.",
        impact: `${formatInr(value)} written off`,
        filter: "expired",
        href: "/expiry-risk",
        tone: "red",
      });
    }

    const high: Rec[] = [];
    if (lowStock.length > 0) {
      high.push({
        title: `${lowStock.length} product${lowStock.length === 1 ? "" : "s"} at or below reorder point`,
        detail: "Place a purchase order before these run out entirely.",
        filter: "low_stock",
        href: "/reorder-intelligence",
        tone: "amber",
      });
    }
    if (expiringSoon.length > 0) {
      const value = expiringSoon.reduce((s, r) => s + r.value, 0);
      high.push({
        title: `${expiringSoon.length} batch${expiringSoon.length === 1 ? "" : "es"} expiring within 90 days`,
        detail: "Prioritize selling these before they become write-offs.",
        impact: `${formatInr(value)} at risk`,
        filter: "expiring",
        href: "/expiry-risk",
        tone: "amber",
      });
    }

    const optimization: Rec[] = [];
    if (overstock.length > 0) {
      const value = overstock.reduce((s, r) => s + r.value, 0);
      optimization.push({
        title: `${overstock.length} product${overstock.length === 1 ? "" : "s"} overstocked`,
        detail: "More than ~6 months of stock at the current sales rate. Reduce next purchase order.",
        impact: `${formatInr(value)} tied up above optimal stock`,
        filter: "overstock",
        href: "/slow-moving",
        tone: "indigo",
      });
    }
    if (slowMoving.length > 0) {
      const value = slowMoving.reduce((s, r) => s + r.value, 0);
      optimization.push({
        title: `${slowMoving.length} product${slowMoving.length === 1 ? "" : "s"} with zero recorded sales`,
        detail: "Sitting in stock with no recorded movement. Consider discounting or discontinuing.",
        impact: `${formatInr(value)} of capital idle`,
        filter: "slow_moving",
        href: "/slow-moving",
        tone: "indigo",
      });
    }

    return { critical, high, optimization };
  }, [records]);

  const nothingToShow = critical.length === 0 && high.length === 0 && optimization.length === 0;

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-8">
      <h1 className="mb-1 text-2xl font-bold text-slate-900">AI Recommendations</h1>
      <p className="mb-6 text-sm text-slate-500">
        Deterministic, explainable signals from your real inventory data — not a black box.
      </p>

      {nothingToShow ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center text-sm text-slate-400">
          Nothing needs attention right now — inventory looks healthy.
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          <Group title="Critical" subtitle="Act now" items={critical} />
          <Group title="High Priority" subtitle="Act this week" items={high} />
          <Group title="Optimization" subtitle="No urgency — improves efficiency" items={optimization} />
        </div>
      )}
    </div>
  );
}

function Group({ title, subtitle, items }: { title: string; subtitle: string; items: Rec[] }) {
  if (items.length === 0) return null;

  const dotColor = items[0]?.tone === "red" ? "bg-red-500" : items[0]?.tone === "amber" ? "bg-amber-500" : "bg-indigo-500";

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${dotColor}`} />
        <h2 className="text-sm font-semibold text-slate-900">{title}</h2>
        <span className="text-xs text-slate-400">{subtitle}</span>
      </div>
      <div className="flex flex-col gap-3">
        {items.map((rec) => (
          <RecCard key={rec.title} rec={rec} />
        ))}
      </div>
    </div>
  );
}

const BORDER: Record<Rec["tone"], string> = {
  red: "border-l-red-500",
  amber: "border-l-amber-500",
  indigo: "border-l-indigo-500",
};

function RecCard({ rec }: { rec: Rec }) {
  return (
    <div className={`flex items-center justify-between gap-4 rounded-lg border border-slate-200 border-l-4 bg-white p-4 ${BORDER[rec.tone]}`}>
      <div>
        <p className="text-sm font-medium text-slate-800">{rec.title}</p>
        <p className="mt-1 text-xs text-slate-500">{rec.detail}</p>
        {rec.impact && <p className="mt-1 text-xs font-medium text-slate-700">{rec.impact}</p>}
      </div>
      <Link
        href={rec.href ?? `/inventory?filter=${rec.filter}`}
        className="shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
      >
        View
      </Link>
    </div>
  );
}
