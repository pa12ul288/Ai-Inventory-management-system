"use client";

import { useAppData } from "@/lib/AppDataContext";
import { downloadPdfReport } from "@/lib/pdfReport";
import { downloadInventoryCsv } from "@/lib/csvExport";
import { formatInr } from "@/lib/format";
import PageStats from "@/components/PageStats";

export default function ReportsPage() {
  const { rows, kpis } = useAppData();

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
      <h1 className="mb-2 text-2xl font-bold text-slate-900">Reports</h1>
      <p className="mb-6 text-sm text-slate-500">
        Download your current inventory recommendations as a PDF summary or a raw CSV export.
      </p>

      <PageStats
        items={[
          { label: "Total Value", value: formatInr(kpis.totalInventoryValue) },
          { label: "Slow / Dead Stock", value: formatInr(kpis.slowDeadStockValue), accent: "text-red-600" },
          { label: "To Reorder", value: String(kpis.productsToReorder), accent: "text-emerald-600" },
          { label: "Capital Freed", value: formatInr(kpis.capitalToFreeUp), accent: "text-teal-600" },
        ]}
      />

      <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row">
        <button
          onClick={() => downloadPdfReport(rows, kpis)}
          className="flex-1 rounded-lg bg-teal-600 px-4 py-3 text-sm font-medium text-white shadow-sm hover:bg-teal-700"
        >
          Generate Full AI Report (PDF)
        </button>
        <button
          onClick={() => downloadInventoryCsv(rows)}
          className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          Export Table (CSV)
        </button>
      </div>
    </div>
  );
}
