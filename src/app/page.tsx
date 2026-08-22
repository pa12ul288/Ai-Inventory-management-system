"use client";

import Link from "next/link";
import { useAppData } from "@/lib/AppDataContext";
import KpiCards from "@/components/KpiCards";
import SellOffList from "@/components/SellOffList";
import KeepReorderList from "@/components/KeepReorderList";

export default function DashboardPage() {
  const { filename, rows, kpis } = useAppData();

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500">{filename}</p>
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SellOffList rows={rows} limit={5} />
        <KeepReorderList rows={rows} limit={5} />
      </div>
    </div>
  );
}
