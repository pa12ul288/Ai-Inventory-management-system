"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import UploadScreen from "@/components/UploadScreen";
import Dashboard from "@/components/Dashboard";
import AppShell from "@/components/AppShell";
import Login from "@/components/Login";
import { supabase, supabaseConfigured } from "@/lib/supabaseClient";
import { fetchInventory, upsertInventory } from "@/lib/inventoryStore";
import { computeKpis } from "@/lib/kpis";
import type { ClassifiedInventoryRow, Classification, IdentifiedRow, RawInventoryRow } from "@/lib/types";

type View = "upload" | "dashboard";

async function classifyRows(identified: IdentifiedRow[]): Promise<ClassifiedInventoryRow[]> {
  if (identified.length === 0) return [];

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

  return identified.map((row) => {
    const result = resultById.get(row.id);
    return {
      ...row,
      value: row.quantityOnHand * row.costPrice,
      daysInStock: result?.daysInStock ?? null,
      daysOnHand: result?.daysOnHand ?? null,
      classification: result?.classification ?? "Watch",
    };
  });
}

export default function Home() {
  const [session, setSession] = useState<Session | null | undefined>(undefined);
  const [view, setView] = useState<View>("upload");
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filename, setFilename] = useState("");
  const [rows, setRows] = useState<ClassifiedInventoryRow[]>([]);

  useEffect(() => {
    if (!supabase) {
      setSession(null);
      return;
    }
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // Dashboard always loads from Supabase on startup/sign-in, never from an
  // in-memory upload — that's the whole point of persisting it.
  useEffect(() => {
    if (!session) return;
    let cancelled = false;
    setLoadingInventory(true);

    (async () => {
      try {
        const identified = await fetchInventory();
        if (cancelled) return;
        if (identified.length === 0) {
          setView("upload");
          setRows([]);
        } else {
          const classified = await classifyRows(identified);
          if (cancelled) return;
          setRows(classified);
          setFilename("Saved inventory");
          setView("dashboard");
        }
      } catch (e) {
        console.error("Failed to load inventory from Supabase:", e);
      } finally {
        if (!cancelled) setLoadingInventory(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session]);

  async function handleAnalyze(rawRows: RawInventoryRow[], fname: string) {
    setAnalyzing(true);
    setError(null);

    try {
      const { error: upsertError } = await upsertInventory(rawRows);
      if (upsertError) throw new Error(upsertError);

      // Reload the full merged inventory from Supabase rather than just the
      // rows from this file, so the dashboard reflects existing + updated +
      // new products together.
      const identified = await fetchInventory();
      const classified = await classifyRows(identified);

      setRows(classified);
      setFilename(fname);
      setView("dashboard");
    } catch (err) {
      console.error(err);
      setError("Something went wrong while saving and analyzing your file. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  }

  function handleUploadNew() {
    setView("upload");
    setError(null);
  }

  async function handleLogout() {
    if (!supabase) return;
    await supabase.auth.signOut();
  }

  if (!supabaseConfigured) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-white px-6 text-center">
        <p className="max-w-md text-sm text-slate-500">
          Supabase isn&apos;t configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
          to your environment to enable login and inventory storage.
        </p>
      </div>
    );
  }

  if (session === undefined) {
    return <div className="flex min-h-screen w-full items-center justify-center bg-white text-slate-400">Loading…</div>;
  }

  if (!session) {
    return <Login />;
  }

  if (loadingInventory) {
    return (
      <AppShell active="Dashboard" onLogout={handleLogout}>
        <div className="flex flex-1 items-center justify-center text-slate-400">Loading your inventory…</div>
      </AppShell>
    );
  }

  if (view === "dashboard") {
    return (
      <AppShell active="Dashboard" onLogout={handleLogout}>
        <Dashboard filename={filename} rows={rows} kpis={computeKpis(rows)} onUploadNew={handleUploadNew} />
      </AppShell>
    );
  }

  return (
    <AppShell active="Dashboard" onLogout={handleLogout}>
      <UploadScreen onAnalyze={handleAnalyze} analyzing={analyzing} errorMessage={error} />
    </AppShell>
  );
}
