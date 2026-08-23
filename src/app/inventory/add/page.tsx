"use client";

import { useState } from "react";
import ManualEntryForm from "@/components/ManualEntryForm";
import ImportWizard from "@/components/ImportWizard";

type Tab = "manual" | "import";

export default function AddInventoryPage() {
  const [tab, setTab] = useState<Tab>("manual");

  return (
    <div className="mx-auto w-full max-w-4xl flex-1 px-6 py-8">
      <h1 className="mb-1 text-2xl font-bold text-slate-900">Add Inventory</h1>
      <p className="mb-6 text-sm text-slate-500">Enter a single batch manually, or import a full file with reconciliation.</p>

      <div className="mb-6 inline-flex rounded-lg border border-slate-200 bg-slate-50 p-1">
        <button
          onClick={() => setTab("manual")}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === "manual" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Manual Entry
        </button>
        <button
          onClick={() => setTab("import")}
          className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            tab === "import" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500 hover:text-slate-700"
          }`}
        >
          Import File
        </button>
      </div>

      {tab === "manual" ? <ManualEntryForm /> : <ImportWizard />}
    </div>
  );
}
