"use client";

import { useRef, useState } from "react";
import { parseInventoryFile } from "@/lib/parseFile";
import type { RawInventoryRow } from "@/lib/types";
import { formatInr } from "@/lib/format";

interface UploadScreenProps {
  onAnalyze: (rows: RawInventoryRow[], filename: string) => void;
  analyzing: boolean;
  errorMessage: string | null;
}

const FIELD_LABELS: Record<string, string> = {
  productName: "Product Name",
  quantityOnHand: "Quantity On Hand",
  costPrice: "Cost Price",
};

export default function UploadScreen({ onAnalyze, analyzing, errorMessage }: UploadScreenProps) {
  const [rows, setRows] = useState<RawInventoryRow[] | null>(null);
  const [filename, setFilename] = useState("");
  const [unmapped, setUnmapped] = useState<string[]>([]);
  const [parseError, setParseError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File) {
    setParseError(null);
    setRows(null);

    const isValidType = /\.(csv|xlsx|xls)$/i.test(file.name);
    if (!isValidType) {
      setParseError("Please upload a .csv, .xlsx, or .xls file.");
      return;
    }

    try {
      const { rows: parsed, unmapped: missing } = await parseInventoryFile(file);
      if (parsed.length === 0) {
        setParseError("No product rows were found in that file.");
        return;
      }
      setRows(parsed);
      setFilename(file.name);
      setUnmapped(missing);
    } catch {
      setParseError("Could not read that file. Please check the format and try again.");
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-16">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold text-slate-900">AI Inventory Management System</h1>
        <p className="mt-2 text-slate-500">
          AI Inventory Tracker for Medical Distributors
        </p>
      </div>

      {!rows && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragActive(true);
          }}
          onDragLeave={() => setDragActive(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-14 text-center transition-colors ${
            dragActive ? "border-teal-500 bg-teal-50" : "border-slate-300 bg-white hover:border-teal-400"
          }`}
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
          <p className="text-lg font-medium text-slate-700">
            Drop your inventory file here, or click to browse
          </p>
          <p className="mt-2 text-sm text-slate-400">Accepts .csv, .xlsx, or .xls</p>
          <p className="mt-4 text-xs text-slate-400">
            Expected columns: Product Name, Quantity On Hand, Cost Price, Last Sale Date, Avg Daily Sales,
            Expiry Date (optional but recommended for medical stock)
          </p>
        </div>
      )}

      {parseError && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{parseError}</p>
      )}
      {errorMessage && (
        <p className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</p>
      )}

      {rows && (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-800">{filename}</p>
              <p className="text-sm text-slate-500">{rows.length} products found</p>
            </div>
            <button
              onClick={() => {
                setRows(null);
                setUnmapped([]);
              }}
              className="text-sm text-slate-500 underline hover:text-slate-700"
            >
              Choose a different file
            </button>
          </div>

          {unmapped.length > 0 && (
            <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Could not find a column for: {unmapped.map((f) => FIELD_LABELS[f] ?? f).join(", ")}.
              Those values will default to empty/zero.
            </p>
          )}

          <div className="max-h-80 overflow-auto rounded-lg border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="sticky top-0 bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left font-medium text-slate-600">Product</th>
                  <th className="px-3 py-2 text-left font-medium text-slate-600">SKU</th>
                  <th className="px-3 py-2 text-right font-medium text-slate-600">Qty</th>
                  <th className="px-3 py-2 text-right font-medium text-slate-600">Cost Price</th>
                  <th className="px-3 py-2 text-left font-medium text-slate-600">Last Sale</th>
                  <th className="px-3 py-2 text-left font-medium text-slate-600">Expiry</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.slice(0, 10).map((r, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 text-slate-800">{r.productName}</td>
                    <td className="px-3 py-2 text-slate-500">{r.sku}</td>
                    <td className="px-3 py-2 text-right text-slate-800">{r.quantityOnHand}</td>
                    <td className="px-3 py-2 text-right text-slate-800">{formatInr(r.costPrice)}</td>
                    <td className="px-3 py-2 text-slate-500">{r.lastSaleDate ?? "—"}</td>
                    <td className="px-3 py-2 text-slate-500">{r.expiryDate ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length > 10 && (
            <p className="text-xs text-slate-400">Showing first 10 of {rows.length} rows.</p>
          )}

          <button
            onClick={() => onAnalyze(rows, filename)}
            disabled={analyzing}
            className="mt-2 rounded-lg bg-teal-600 px-6 py-3 font-medium text-white transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-teal-300"
          >
            {analyzing ? "Analyzing…" : "Analyze Inventory"}
          </button>
        </div>
      )}
    </div>
  );
}
