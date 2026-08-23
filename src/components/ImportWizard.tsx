"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAppData } from "@/lib/AppDataContext";
import { DEFAULT_WAREHOUSE_NAME } from "@/lib/inventoryData";
import { fetchReconciliationLookups } from "@/lib/inventoryData";
import { readFileRecords, autoDetectHeaderMap, mapRecordsToImportRows, IMPORT_FIELDS, type HeaderMap } from "@/lib/parseFile";
import { reconcileImport } from "@/lib/reconciliation";
import type { ImportRow, ReconciliationSummary } from "@/lib/types";

type Step = "upload" | "map" | "preview" | "done";

export default function ImportWizard() {
  const router = useRouter();
  const { handleImportCommit } = useAppData();
  const inputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("upload");
  const [filename, setFilename] = useState("");
  const [headers, setHeaders] = useState<string[]>([]);
  const [records, setRecords] = useState<Record<string, unknown>[]>([]);
  const [headerMap, setHeaderMap] = useState<HeaderMap>({});
  const [defaultWarehouse, setDefaultWarehouse] = useState(DEFAULT_WAREHOUSE_NAME);
  const [summary, setSummary] = useState<ReconciliationSummary | null>(null);
  const [committing, setCommitting] = useState(false);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showIssuesOnly, setShowIssuesOnly] = useState(false);

  async function handleFile(file: File) {
    setError(null);
    if (!/\.(csv|xlsx|xls)$/i.test(file.name)) {
      setError("Please upload a .csv, .xlsx, or .xls file.");
      return;
    }
    try {
      const { headers: h, records: r } = await readFileRecords(file);
      if (r.length === 0) {
        setError("No rows were found in that file.");
        return;
      }
      setFilename(file.name);
      setHeaders(h);
      setRecords(r);
      setHeaderMap(autoDetectHeaderMap(h));
      setStep("map");
    } catch {
      setError("Could not read that file. Please check the format and try again.");
    }
  }

  async function handleValidate() {
    const missingRequired = IMPORT_FIELDS.filter((f) => f.required && !headerMap[f.key]);
    if (missingRequired.length > 0) {
      setError(`Map a column for: ${missingRequired.map((f) => f.label).join(", ")}`);
      return;
    }
    setError(null);
    setValidating(true);
    try {
      const importRows: ImportRow[] = mapRecordsToImportRows(records, headerMap);
      const lookups = await fetchReconciliationLookups();
      const result = reconcileImport(importRows, lookups.products, lookups.batches, defaultWarehouse || DEFAULT_WAREHOUSE_NAME);
      setSummary(result);
      setStep("preview");
    } catch (e) {
      console.error(e);
      setError("Something went wrong validating the file. Please try again.");
    } finally {
      setValidating(false);
    }
  }

  async function handleConfirm() {
    if (!summary) return;
    setCommitting(true);
    setError(null);
    const result = await handleImportCommit(summary, defaultWarehouse || DEFAULT_WAREHOUSE_NAME);
    setCommitting(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setStep("done");
  }

  function reset() {
    setStep("upload");
    setFilename("");
    setHeaders([]);
    setRecords([]);
    setHeaderMap({});
    setSummary(null);
    setError(null);
    setShowIssuesOnly(false);
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <WizardSteps step={step} />

      {error && <p className="mb-4 mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      {step === "upload" && (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files?.[0];
            if (file) handleFile(file);
          }}
          onClick={() => inputRef.current?.click()}
          className="mt-4 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-12 text-center hover:border-teal-400"
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
              e.target.value = "";
            }}
          />
          <p className="text-sm font-medium text-slate-700">Drop your inventory file here, or click to browse</p>
          <p className="mt-1 text-xs text-slate-400">Accepts .csv, .xlsx, or .xls</p>
        </div>
      )}

      {step === "map" && (
        <div className="mt-4">
          <p className="mb-1 text-sm font-medium text-slate-800">{filename}</p>
          <p className="mb-4 text-sm text-slate-500">
            {records.length} rows detected. Confirm which column in your file maps to each field below — required
            fields are marked with *.
          </p>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {IMPORT_FIELDS.map((field) => (
              <label key={field.key} className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-slate-700">
                  {field.label}
                  {field.required && <span className="text-red-500"> *</span>}
                </span>
                <select
                  value={headerMap[field.key] ?? ""}
                  onChange={(e) =>
                    setHeaderMap((m) => ({ ...m, [field.key]: e.target.value || undefined }))
                  }
                  className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
                >
                  <option value="">— Not in file —</option>
                  {headers.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </label>
            ))}
          </div>

          <label className="mt-4 flex max-w-xs flex-col gap-1.5 text-sm">
            <span className="font-medium text-slate-700">Default warehouse for rows without one</span>
            <input
              type="text"
              value={defaultWarehouse}
              onChange={(e) => setDefaultWarehouse(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
            />
          </label>

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleValidate}
              disabled={validating}
              className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-teal-300"
            >
              {validating ? "Validating…" : "Validate & Preview"}
            </button>
            <button onClick={reset} className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Start Over
            </button>
          </div>
        </div>
      )}

      {step === "preview" && summary && (
        <div className="mt-4">
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
            <SummaryStat label="Total Rows" value={summary.totalRows} />
            <SummaryStat label="New Products" value={summary.newProducts} accent="text-teal-700" />
            <SummaryStat label="New Batches" value={summary.newBatches} accent="text-emerald-700" />
            <SummaryStat label="Updated" value={summary.updatedBatches} accent="text-amber-700" />
            <SummaryStat
              label="Duplicates / Errors"
              value={summary.duplicates + summary.errors}
              accent={summary.errors > 0 ? "text-red-700" : "text-slate-700"}
            />
          </div>

          {(summary.duplicates > 0 || summary.errors > 0) && (
            <label className="mb-3 flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={showIssuesOnly}
                onChange={(e) => setShowIssuesOnly(e.target.checked)}
                className="rounded border-slate-300"
              />
              Show only duplicates and errors
            </label>
          )}

          <div className="max-h-96 overflow-auto rounded-lg border border-slate-100">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="sticky top-0 bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-slate-600">Row</th>
                  <th className="px-3 py-2 text-left font-medium text-slate-600">Product</th>
                  <th className="px-3 py-2 text-left font-medium text-slate-600">Batch</th>
                  <th className="px-3 py-2 text-right font-medium text-slate-600">Qty</th>
                  <th className="px-3 py-2 text-left font-medium text-slate-600">Action</th>
                  <th className="px-3 py-2 text-left font-medium text-slate-600">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary.items
                  .filter((i) => !showIssuesOnly || i.action === "duplicate" || i.action === "error")
                  .map((item) => (
                    <tr key={item.rowIndex} className={item.action === "error" ? "bg-red-50/60" : item.action === "duplicate" ? "bg-amber-50/60" : ""}>
                      <td className="px-3 py-2 text-slate-500">{item.rowIndex + 1}</td>
                      <td className="px-3 py-2 text-slate-800">{item.row.productName || "—"}</td>
                      <td className="px-3 py-2 text-slate-500">{item.row.batchNumber || "—"}</td>
                      <td className="px-3 py-2 text-right text-slate-800">{item.row.quantity}</td>
                      <td className="px-3 py-2">
                        <ActionPill action={item.action} />
                      </td>
                      <td className="px-3 py-2 text-xs text-slate-500">{item.issues.join("; ") || "—"}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <p className="mt-3 text-xs text-slate-400">
            Duplicate and error rows will be skipped automatically — nothing will overwrite existing inventory
            without going through this review.
          </p>

          <div className="mt-6 flex gap-3">
            <button
              onClick={handleConfirm}
              disabled={committing}
              className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-teal-300"
            >
              {committing ? "Importing…" : `Confirm Import (${summary.totalRows - summary.duplicates - summary.errors} rows)`}
            </button>
            <button onClick={() => setStep("map")} className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Back
            </button>
          </div>
        </div>
      )}

      {step === "done" && summary && (
        <div className="mt-4 flex flex-col items-start gap-4">
          <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Import complete: {summary.newProducts} new product{summary.newProducts === 1 ? "" : "s"},{" "}
            {summary.newBatches} new batch{summary.newBatches === 1 ? "" : "es"}, {summary.updatedBatches} batch
            {summary.updatedBatches === 1 ? "" : "es"} updated.
          </p>
          <div className="flex gap-3">
            <button onClick={() => router.push("/inventory")} className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-700">
              View Inventory
            </button>
            <button onClick={reset} className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Import Another File
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function WizardSteps({ step }: { step: Step }) {
  const steps: { key: Step; label: string }[] = [
    { key: "upload", label: "Upload" },
    { key: "map", label: "Map Columns" },
    { key: "preview", label: "Validate & Preview" },
    { key: "done", label: "Done" },
  ];
  const activeIndex = steps.findIndex((s) => s.key === step);

  return (
    <div className="flex items-center gap-2 text-xs font-medium">
      {steps.map((s, i) => (
        <div key={s.key} className="flex items-center gap-2">
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full ${
              i <= activeIndex ? "bg-teal-600 text-white" : "bg-slate-100 text-slate-400"
            }`}
          >
            {i + 1}
          </span>
          <span className={i <= activeIndex ? "text-slate-800" : "text-slate-400"}>{s.label}</span>
          {i < steps.length - 1 && <span className="mx-1 h-px w-6 bg-slate-200" />}
        </div>
      ))}
    </div>
  );
}

function SummaryStat({ label, value, accent = "text-slate-900" }: { label: string; value: number; accent?: string }) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-3 text-center">
      <p className={`text-xl font-bold ${accent}`}>{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}

function ActionPill({ action }: { action: ReconciliationSummary["items"][number]["action"] }) {
  const styles: Record<typeof action, string> = {
    new_product: "bg-teal-50 text-teal-700",
    new_batch: "bg-emerald-50 text-emerald-700",
    update_batch: "bg-amber-50 text-amber-700",
    duplicate: "bg-slate-100 text-slate-500",
    error: "bg-red-100 text-red-700",
  };
  const labels: Record<typeof action, string> = {
    new_product: "New Product",
    new_batch: "New Batch",
    update_batch: "Update",
    duplicate: "Duplicate",
    error: "Error",
  };
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${styles[action]}`}>{labels[action]}</span>;
}
