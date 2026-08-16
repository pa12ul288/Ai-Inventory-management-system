"use client";

import { useState } from "react";
import UploadScreen from "@/components/UploadScreen";
import Dashboard from "@/components/Dashboard";
import { saveUpload, saveClassifications } from "@/lib/storage";
import { computeFeatures } from "@/lib/classify";
import { computeKpis } from "@/lib/kpis";
import type { ClassifiedInventoryRow, Classification, IdentifiedRow, RawInventoryRow } from "@/lib/types";

type View = "upload" | "dashboard";

export default function Home() {
  const [view, setView] = useState<View>("upload");
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filename, setFilename] = useState("");
  const [rows, setRows] = useState<ClassifiedInventoryRow[]>([]);

  async function handleAnalyze(rawRows: RawInventoryRow[], fname: string) {
    setAnalyzing(true);
    setError(null);

    try {
      const identified: IdentifiedRow[] = rawRows.map((row) => ({
        ...row,
        id: crypto.randomUUID(),
      }));

      saveUpload(fname, identified).catch((e) => console.error("Supabase upload save failed:", e));

      const res = await fetch("/api/classify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: identified.map((row) => ({ id: row.id, row })) }),
      });

      if (!res.ok) throw new Error("Classification request failed");

      const data: {
        items: { id: string; daysInStock: number | null; daysOnHand: number | null; classification: Classification }[];
      } = await res.json();

      const resultById = new Map(data.items.map((item) => [item.id, item]));

      const classified: ClassifiedInventoryRow[] = identified.map((row) => {
        const result = resultById.get(row.id);
        const features = computeFeatures(row);
        return {
          ...row,
          value: row.quantityOnHand * row.costPrice,
          daysInStock: result?.daysInStock ?? features.daysInStock,
          daysOnHand: result?.daysOnHand ?? features.daysOnHand,
          classification: result?.classification ?? "Watch",
        };
      });

      setRows(classified);
      setFilename(fname);
      setView("dashboard");

      saveClassifications(classified).catch((e) => console.error("Supabase classification save failed:", e));
    } catch {
      setError("Something went wrong while analyzing your file. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  }

  function handleUploadNew() {
    setView("upload");
    setRows([]);
    setFilename("");
    setError(null);
  }

  if (view === "dashboard") {
    return (
      <Dashboard filename={filename} rows={rows} kpis={computeKpis(rows)} onUploadNew={handleUploadNew} />
    );
  }

  return <UploadScreen onAnalyze={handleAnalyze} analyzing={analyzing} errorMessage={error} />;
}
