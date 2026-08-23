"use client";

import Link from "next/link";
import { useAppData } from "@/lib/AppDataContext";
import PageStats from "@/components/PageStats";
import InventoryTable from "@/components/InventoryTable";
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
  filter: FilterValue;
  tone: "red" | "amber";
}

const TONE_STYLES: Record<AttentionItem["tone"], string> = {
  red: "border-red-200 bg-red-50 text-red-700",
  amber: "border-amber-200 bg-amber-50 text-amber-700",
};

export default function DashboardPage() {
  const { session, records, kpis } = useAppData();

  const allItems: AttentionItem[] = [
    { label: "Out of stock", count: kpis.outOfStockCount, filter: "out_of_stock", tone: "red" },
    { label: "Expired", count: kpis.expiredCount, filter: "expired", tone: "red" },
    { label: "Low stock", count: kpis.lowStockCount, filter: "low_stock", tone: "amber" },
    { label: "Expiring within 90 days", count: kpis.nearExpiryCount, filter: "expiring", tone: "amber" },
  ];
  const items = allItems.filter((item) => item.count > 0);

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Welcome back, {greetingName(session?.user?.email)}</h1>
          <p className="text-sm text-slate-500">Here&apos;s how your inventory looks today.</p>
        </div>
        <Link
          href="/inventory/add"
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
        >
          Add Inventory
        </Link>
      </div>

      <PageStats
        items={[
          { label: "Total Inventory Value", value: formatInr(kpis.totalInventoryValue), subtitle: "All warehouses" },
          { label: "Low Stock Items", value: String(kpis.lowStockCount), accent: "text-amber-600", subtitle: "At/below reorder point" },
          { label: "Out of Stock", value: String(kpis.outOfStockCount), accent: "text-red-600", subtitle: "Needs restock" },
          { label: "Near-Expiry Value", value: formatInr(kpis.nearExpiryValue), accent: "text-amber-600", subtitle: "Within 90 days" },
        ]}
      />

      {items.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {items.map((item) => (
            <Link
              key={item.label}
              href={`/inventory?filter=${item.filter}`}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium transition-opacity hover:opacity-80 ${TONE_STYLES[item.tone]}`}
            >
              {item.count} {item.label}
            </Link>
          ))}
        </div>
      )}

      <InventoryTable records={records} />
    </div>
  );
}
