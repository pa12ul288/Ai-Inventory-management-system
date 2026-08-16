"use client";

import { useState } from "react";
import type { ClassifiedInventoryRow, DashboardKpis } from "@/lib/types";
import { downloadPdfReport } from "@/lib/pdfReport";
import { downloadInventoryCsv } from "@/lib/csvExport";
import KpiCards from "./KpiCards";
import SellOffList from "./SellOffList";
import KeepReorderList from "./KeepReorderList";
import InventoryTable from "./InventoryTable";
import FilterModal from "./FilterModal";

interface DashboardProps {
  filename: string;
  rows: ClassifiedInventoryRow[];
  kpis: DashboardKpis;
  onUploadNew: () => void;
}

export default function Dashboard({ filename, rows, kpis, onUploadNew }: DashboardProps) {
  const [modal, setModal] = useState<"sellOff" | "reorder" | null>(null);

  const sellOffRows = rows.filter((r) => r.classification === "Sell off");
  const reorderRows = rows.filter((r) => r.classification === "Keep & Reorder");

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">AI Inventory Management System</h1>
          <p className="text-sm text-slate-500">{filename}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => downloadPdfReport(rows, kpis)}
            className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
          >
            Generate Full AI Report
          </button>
          <button
            onClick={() => setModal("sellOff")}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Clear Slow Stock
          </button>
          <button
            onClick={() => setModal("reorder")}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            What to Reorder
          </button>
          <button
            onClick={() => downloadInventoryCsv(rows)}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Export Table
          </button>
          <button
            onClick={onUploadNew}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Upload New Data
          </button>
        </div>
      </div>

      <div className="mb-6">
        <KpiCards kpis={kpis} />
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SellOffList rows={rows} />
        <KeepReorderList rows={rows} />
      </div>

      <InventoryTable rows={rows} />

      {modal === "sellOff" && (
        <FilterModal
          title="Clear Slow Stock — Sell Off Items"
          rows={sellOffRows}
          mode="sellOff"
          onClose={() => setModal(null)}
        />
      )}
      {modal === "reorder" && (
        <FilterModal
          title="What to Reorder — Keep & Reorder Items"
          rows={reorderRows}
          mode="reorder"
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}
