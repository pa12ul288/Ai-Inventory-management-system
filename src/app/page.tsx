"use client";

import Link from "next/link";
import { useAppData } from "@/lib/AppDataContext";
import PageStats from "@/components/PageStats";
import { formatInr } from "@/lib/format";
import type { FilterValue } from "@/components/InventoryTable";

function greetingName(email: string | undefined) {
  if (!email) return "there";
  const local = email.split("@")[0];
  return local.charAt(0).toUpperCase() + local.slice(1);
}

interface AttentionItem {
  label: string;
  count: number;
  value?: number;
  filter: FilterValue;
  tone: "red" | "amber" | "indigo" | "slate";
}

const TONE_STYLES: Record<AttentionItem["tone"], { dot: string; border: string }> = {
  red: { dot: "bg-red-500", border: "border-l-red-500" },
  amber: { dot: "bg-amber-500", border: "border-l-amber-500" },
  indigo: { dot: "bg-indigo-500", border: "border-l-indigo-500" },
  slate: { dot: "bg-slate-400", border: "border-l-slate-400" },
};

export default function DashboardPage() {
  const { session, records, kpis } = useAppData();

  const allItems: AttentionItem[] = [
    { label: "Out of stock", count: kpis.outOfStockCount, filter: "out_of_stock", tone: "red" },
    { label: "Expired batches", count: kpis.expiredCount, value: kpis.expiredValue, filter: "expired", tone: "red" },
    { label: "Low stock", count: kpis.lowStockCount, filter: "low_stock", tone: "amber" },
    {
      label: "Expiring within 90 days",
      count: kpis.nearExpiryCount,
      value: kpis.nearExpiryValue,
      filter: "expiring",
      tone: "amber",
    },
    {
      label: "Overstock",
      count: records.filter((r) => r.stockStatus === "overstock").length,
      filter: "overstock",
      tone: "indigo",
    },
    {
      label: "Slow moving",
      count: records.filter((r) => r.stockStatus === "slow_moving").length,
      filter: "slow_moving",
      tone: "slate",
    },
  ];
  const items = allItems.filter((item) => item.count > 0);

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back, {greetingName(session?.user?.email)}</h1>
          <p className="text-sm text-slate-500">Here&apos;s what needs your attention today.</p>
        </div>
        <Link
          href="/inventory/add"
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700"
        >
          Add Inventory
        </Link>
      </div>

      <PageStats
        items={[
          { label: "Total Inventory Value", value: formatInr(kpis.totalInventoryValue) },
          { label: "Total SKUs", value: String(kpis.totalSkus) },
          { label: "Available Stock (units)", value: String(kpis.availableStock) },
        ]}
      />

      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <h2 className="mb-4 font-semibold text-slate-900">Needs Attention</h2>

        {items.length === 0 ? (
          <p className="text-sm text-slate-400">Nothing needs attention right now — inventory looks healthy.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {items.map((item) => {
              const tone = TONE_STYLES[item.tone];
              return (
                <div
                  key={item.label}
                  className={`flex items-center justify-between gap-4 rounded-lg border-l-4 bg-slate-50 px-4 py-3 ${tone.border}`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`h-2 w-2 shrink-0 rounded-full ${tone.dot}`} />
                    <div>
                      <p className="text-sm font-medium text-slate-800">
                        {item.count} {item.label}
                      </p>
                      {item.value !== undefined && (
                        <p className="text-xs text-slate-500">{formatInr(item.value)} at risk</p>
                      )}
                    </div>
                  </div>
                  <Link
                    href={`/inventory?filter=${item.filter}`}
                    className="shrink-0 rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    View
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
