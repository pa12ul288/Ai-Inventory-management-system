"use client";

import { useMemo } from "react";
import { useAppData } from "@/lib/AppDataContext";
import PageStats from "@/components/PageStats";
import InventoryTable from "@/components/InventoryTable";
import { formatInr } from "@/lib/format";
import type { ExpiryStatus } from "@/lib/types";

const BUCKETS: { label: string; status: ExpiryStatus; tone: string }[] = [
  { label: "Already Expired", status: "expired", tone: "bg-red-500" },
  { label: "Expiring in 0–30 days", status: "expiring_30", tone: "bg-red-400" },
  { label: "Expiring in 31–60 days", status: "expiring_60", tone: "bg-amber-500" },
  { label: "Expiring in 61–90 days", status: "expiring_90", tone: "bg-amber-400" },
];

export default function ExpiryRiskPage() {
  const { records } = useAppData();

  const atRisk = useMemo(
    () => records.filter((r) => BUCKETS.some((b) => b.status === r.expiryStatus)),
    [records]
  );

  const bucketStats = useMemo(
    () =>
      BUCKETS.map((b) => {
        const matched = records.filter((r) => r.expiryStatus === b.status);
        return { ...b, count: matched.length, value: matched.reduce((s, r) => s + r.value, 0) };
      }),
    [records]
  );

  const totalValueAtRisk = bucketStats.reduce((s, b) => s + b.value, 0);
  const maxValue = Math.max(1, ...bucketStats.map((b) => b.value));

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="mb-1 text-2xl font-bold text-slate-900">Expiry Risk</h1>
      <p className="mb-6 text-sm text-slate-500">Batches at risk of expiring, ranked by how much time is left.</p>

      <PageStats
        items={[
          { label: "Batches at Risk", value: String(atRisk.length) },
          { label: "Value at Risk", value: formatInr(totalValueAtRisk), accent: totalValueAtRisk > 0 ? "text-red-600" : undefined },
          { label: "Already Expired", value: String(bucketStats[0].count), accent: bucketStats[0].count > 0 ? "text-red-600" : undefined },
          { label: "Expiring within 30 Days", value: String(bucketStats[1].count), accent: bucketStats[1].count > 0 ? "text-amber-600" : undefined },
        ]}
      />

      <div className="mb-6 rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/40 p-5">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">Value by Time Window</h2>
        <div className="flex flex-col gap-3">
          {bucketStats.map((b) => (
            <div key={b.label} className="flex items-center gap-3">
              <span className="w-48 shrink-0 text-xs text-slate-500">{b.label}</span>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
                <div className={`h-full rounded-full ${b.tone}`} style={{ width: `${(b.value / maxValue) * 100}%` }} />
              </div>
              <span className="w-28 shrink-0 text-right text-xs font-medium text-slate-700">{formatInr(b.value)}</span>
              <span className="w-16 shrink-0 text-right text-xs text-slate-400">{b.count} batches</span>
            </div>
          ))}
        </div>
      </div>

      <InventoryTable records={atRisk} initialFilter="All" />
    </div>
  );
}
