"use client";

import Link from "next/link";
import { useMemo } from "react";
import type { Session } from "@supabase/supabase-js";
import { useAppData } from "@/lib/AppDataContext";
import PageStats from "@/components/PageStats";
import InventoryTable from "@/components/InventoryTable";
import { formatInr } from "@/lib/format";
import type { FilterValue } from "@/components/InventoryTable";

function greetingName(session: Session | null | undefined) {
  const companyName = session?.user?.user_metadata?.company_name as string | undefined;
  if (companyName) return companyName;
  const email = session?.user?.email;
  if (!email) return "there";
  const local = email.split("@")[0];
  return local.charAt(0).toUpperCase() + local.slice(1);
}

interface AttentionItem {
  label: string;
  count: number;
  value: number;
  filter: FilterValue;
  href?: string;
  tone: "red" | "amber";
}

const TONE_STYLES: Record<AttentionItem["tone"], string> = {
  red: "border-red-200 bg-red-50 text-red-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
};

export default function DashboardPage() {
  const { session, records, kpis, invoices } = useAppData();

  const overdueReceivables = useMemo(
    () => invoices.filter((i) => i.status === "overdue").reduce((s, i) => s + i.amount, 0),
    [invoices]
  );
  const capitalAtRisk = kpis.nearExpiryValue + kpis.expiredValue + overdueReceivables;

  const allItems: AttentionItem[] = [
    { label: "Out of stock", count: kpis.outOfStockCount, value: 0, filter: "out_of_stock", tone: "red" },
    { label: "Expired", count: kpis.expiredCount, value: kpis.expiredValue, filter: "expired", href: "/expiry-risk", tone: "red" },
    { label: "Overdue receivables", count: invoices.filter((i) => i.status === "overdue").length, value: overdueReceivables, filter: "All", href: "/customers", tone: "red" },
    { label: "Low stock", count: kpis.lowStockCount, value: 0, filter: "low_stock", href: "/reorder-intelligence", tone: "amber" },
    { label: "Expiring within 90 days", count: kpis.nearExpiryCount, value: kpis.nearExpiryValue, filter: "expiring", href: "/expiry-risk", tone: "amber" },
  ];
  const items = allItems.filter((item) => item.count > 0).sort((a, b) => b.value - a.value);

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Welcome back, {greetingName(session)}</h1>
          <p className="text-sm text-slate-500">Here&apos;s where your capital stands today.</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/customers"
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            Record Sale
          </Link>
          <Link
            href="/inventory/add"
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm shadow-teal-600/20 hover:bg-teal-700"
          >
            Add Inventory
          </Link>
        </div>
      </div>

      <PageStats
        items={[
          { label: "Total Inventory Value", value: formatInr(kpis.totalInventoryValue), subtitle: "All warehouses" },
          { label: "Capital at Risk", value: formatInr(capitalAtRisk), accent: capitalAtRisk > 0 ? "text-red-600" : undefined, subtitle: "Expired + expiring + overdue" },
          { label: "Out of Stock", value: String(kpis.outOfStockCount), accent: "text-red-600", subtitle: "Needs restock" },
          { label: "Low Stock Items", value: String(kpis.lowStockCount), accent: "text-amber-600", subtitle: "At/below reorder point" },
        ]}
      />

      {items.length > 0 && (
        <div className="mb-6 rounded-xl border border-slate-200 bg-white p-4 shadow-sm shadow-slate-200/40">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">Needs Your Attention</p>
          <div className="flex flex-wrap gap-2">
            {items.map((item) => (
              <Link
                key={item.label}
                href={item.href ?? `/inventory?filter=${item.filter}`}
                className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-80 ${TONE_STYLES[item.tone]}`}
              >
                <span>{item.count} {item.label}</span>
                {item.value > 0 && <span className="opacity-70">· {formatInr(item.value)}</span>}
              </Link>
            ))}
          </div>
        </div>
      )}

      <InventoryTable records={records} />
    </div>
  );
}
