"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useAppData } from "@/lib/AppDataContext";
import PageStats from "@/components/PageStats";
import { formatInr } from "@/lib/format";

const BUCKETS = [
  { label: "0–30 days", min: 0, max: 30 },
  { label: "31–60 days", min: 31, max: 60 },
  { label: "61–90 days", min: 61, max: 90 },
  { label: "90+ days", min: 91, max: Infinity },
];

export default function CashFlowPage() {
  const { invoices, kpis } = useAppData();

  const { totalOutstanding, totalOverdue, buckets, expiryLockedValue } = useMemo(() => {
    const outstanding = invoices.filter((i) => i.status !== "paid");
    const overdue = invoices.filter((i) => i.status === "overdue");

    const buckets = BUCKETS.map((b) => ({
      ...b,
      amount: overdue
        .filter((i) => (i.daysOverdue ?? 0) >= b.min && (i.daysOverdue ?? 0) <= b.max)
        .reduce((s, i) => s + i.amount, 0),
    }));

    return {
      totalOutstanding: outstanding.reduce((s, i) => s + i.amount, 0),
      totalOverdue: overdue.reduce((s, i) => s + i.amount, 0),
      buckets,
      expiryLockedValue: kpis.nearExpiryValue + kpis.expiredValue,
    };
  }, [invoices, kpis]);

  const maxBucket = Math.max(1, ...buckets.map((b) => b.amount));

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="mb-1 text-2xl font-bold text-slate-900">Cash Flow</h1>
      <p className="mb-6 text-sm text-slate-500">Cash tied up in receivables and inventory, from real recorded data.</p>

      <PageStats
        items={[
          { label: "Cash Locked in Inventory", value: formatInr(kpis.totalInventoryValue), subtitle: "Total stock value on hand" },
          { label: "Outstanding Receivables", value: formatInr(totalOutstanding) },
          { label: "Overdue Receivables", value: formatInr(totalOverdue), accent: totalOverdue > 0 ? "text-red-600" : undefined },
          { label: "Value at Expiry Risk", value: formatInr(expiryLockedValue), accent: expiryLockedValue > 0 ? "text-amber-600" : undefined },
        ]}
      />

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/40 p-5">
        <h2 className="mb-4 text-sm font-semibold text-slate-900">Receivables Aging</h2>
        {totalOverdue === 0 ? (
          <p className="text-sm text-slate-400">No overdue invoices right now.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {buckets.map((b) => (
              <div key={b.label} className="flex items-center gap-3">
                <span className="w-24 shrink-0 text-xs text-slate-500">{b.label}</span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-red-400"
                    style={{ width: `${(b.amount / maxBucket) * 100}%` }}
                  />
                </div>
                <span className="w-28 shrink-0 text-right text-xs font-medium text-slate-700">{formatInr(b.amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/40 p-4">
        <p className="text-sm text-slate-600">See which customers are driving overdue receivables.</p>
        <Link
          href="/customers"
          className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
        >
          View Customers
        </Link>
      </div>

      <p className="mt-4 text-xs text-slate-400">
        Receivables come from invoices recorded on the Customers page. Bank balance and payables (money you owe
        suppliers) aren&apos;t tracked yet, so this isn&apos;t a full cash position — it&apos;s the two biggest
        levers this app has real data for: money owed to you, and money tied up in stock.
      </p>
    </div>
  );
}
