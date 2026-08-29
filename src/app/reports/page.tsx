"use client";

import { useAppData } from "@/lib/AppDataContext";
import { downloadPdfReport } from "@/lib/pdfReport";
import { downloadInventoryCsv } from "@/lib/csvExport";
import { formatInr } from "@/lib/format";
import PageStats from "@/components/PageStats";

export default function ReportsPage() {
  const { records, kpis } = useAppData();

  const stockoutRecords = records.filter((r) => r.stockStatus === "out_of_stock" || r.stockStatus === "low_stock");
  const expiryRecords = records.filter((r) => r.expiryStatus !== "healthy" && r.expiryStatus !== "unknown");

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="mb-2 text-2xl font-bold text-slate-900">Reports</h1>
      <p className="mb-6 text-sm text-slate-500">Export the reports that actually drive decisions — valuation, expiry, and stockouts.</p>

      <PageStats
        items={[
          { label: "Total Value", value: formatInr(kpis.totalInventoryValue) },
          { label: "Total SKUs", value: String(kpis.totalSkus) },
          { label: "Near-Expiry Value", value: formatInr(kpis.nearExpiryValue + kpis.expiredValue), accent: "text-amber-600" },
          { label: "Out of Stock", value: String(kpis.outOfStockCount), accent: "text-red-600" },
        ]}
      />

      <div className="flex flex-col gap-3">
        <ReportRow
          title="Full Inventory Report"
          description="Valuation summary, stockouts, and expiry watch in one PDF."
          action="Download PDF"
          onClick={() => downloadPdfReport(records, kpis)}
          primary
        />
        <ReportRow
          title="Inventory Valuation"
          description="Every batch, with quantity, warehouse, and value — as a spreadsheet."
          action="Export CSV"
          onClick={() => downloadInventoryCsv(records, "inventory-valuation.csv")}
        />
        <ReportRow
          title="Stockout Report"
          description={`${stockoutRecords.length} batch${stockoutRecords.length === 1 ? "" : "es"} out of stock or below reorder point.`}
          action="Export CSV"
          onClick={() => downloadInventoryCsv(stockoutRecords, "stockout-report.csv")}
          disabled={stockoutRecords.length === 0}
        />
        <ReportRow
          title="Expiry Report"
          description={`${expiryRecords.length} batch${expiryRecords.length === 1 ? "" : "es"} expired or expiring within 90 days.`}
          action="Export CSV"
          onClick={() => downloadInventoryCsv(expiryRecords, "expiry-report.csv")}
          disabled={expiryRecords.length === 0}
        />
      </div>
    </div>
  );
}

function ReportRow({
  title,
  description,
  action,
  onClick,
  primary = false,
  disabled = false,
}: {
  title: string;
  description: string;
  action: string;
  onClick: () => void;
  primary?: boolean;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/40 p-5">
      <div>
        <p className="font-medium text-slate-900">{title}</p>
        <p className="text-sm text-slate-500">{description}</p>
      </div>
      <button
        onClick={onClick}
        disabled={disabled}
        className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-40 ${
          primary ? "bg-teal-600 text-white hover:bg-teal-700" : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
        }`}
      >
        {action}
      </button>
    </div>
  );
}
