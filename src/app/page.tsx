"use client";

import Link from "next/link";
import { useAppData } from "@/lib/AppDataContext";
import KpiCards from "@/components/KpiCards";
import SellOffList from "@/components/SellOffList";
import KeepReorderList from "@/components/KeepReorderList";
import ExpiryWatchList from "@/components/ExpiryWatchList";
import InventoryBreakdownChart from "@/components/InventoryBreakdownChart";

function greetingName(email: string | undefined) {
  if (!email) return "there";
  const local = email.split("@")[0];
  return local.charAt(0).toUpperCase() + local.slice(1);
}

export default function DashboardPage() {
  const { session, filename, rows, kpis } = useAppData();

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome back, {greetingName(session?.user?.email)}
          </h1>
          <p className="text-sm text-slate-500">
            {filename ? `Latest data: ${filename}` : "Here's how your inventory looks today."}
          </p>
        </div>
        <Link
          href="/upload"
          className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-teal-700"
        >
          Add / Update Inventory
        </Link>
      </div>

      <div className="mb-6">
        <KpiCards kpis={kpis} />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <InventoryBreakdownChart rows={rows} />
        </div>
        <div className="flex flex-col justify-between rounded-2xl bg-gradient-to-br from-teal-600 to-teal-700 p-6 text-white shadow-sm">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-teal-100">AI-Powered</p>
            <h2 className="mt-1 text-lg font-semibold">Full recommendation report</h2>
            <p className="mt-2 text-sm text-teal-50">
              Every product here was classified automatically. Download a complete PDF summary to share or
              plan purchasing around.
            </p>
          </div>
          <Link
            href="/reports"
            className="mt-4 inline-flex w-fit items-center rounded-lg bg-white px-4 py-2 text-sm font-medium text-teal-700 hover:bg-teal-50"
          >
            Go to Reports
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SellOffList rows={rows} limit={5} />
        <KeepReorderList rows={rows} limit={5} />
        <ExpiryWatchList rows={rows} limit={5} />
      </div>
    </div>
  );
}
