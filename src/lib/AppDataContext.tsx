"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import type { Session } from "@supabase/supabase-js";
import { supabase, supabaseConfigured } from "./supabaseClient";
import { fetchInventory, upsertInventory } from "./inventoryStore";
import { computeKpis } from "./kpis";
import type { ClassifiedInventoryRow, Classification, DashboardKpis, IdentifiedRow, RawInventoryRow } from "./types";

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

interface AppDataValue {
  session: Session | null | undefined;
  loadingInventory: boolean;
  analyzing: boolean;
  error: string | null;
  filename: string;
  rows: ClassifiedInventoryRow[];
  kpis: DashboardKpis;
  hasInventory: boolean;
  handleAnalyze: (rawRows: RawInventoryRow[], fname: string) => Promise<void>;
  handleLogout: () => Promise<void>;
}

const AppDataContext = createContext<AppDataValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null | undefined>(() => (supabase ? undefined : null));
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filename, setFilename] = useState("");
  const [rows, setRows] = useState<ClassifiedInventoryRow[]>([]);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  // Inventory always loads from Supabase on sign-in, never from leftover
  // in-memory state.
  useEffect(() => {
    if (!session) return;
    let cancelled = false;

    (async () => {
      setLoadingInventory(true);
      try {
        const identified = await fetchInventory();
        if (cancelled) return;
        if (identified.length > 0) {
          const classified = await classifyRows(identified);
          if (cancelled) return;
          setRows(classified);
          setFilename("Saved inventory");
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
      router.push("/");
    } catch (err) {
      console.error(err);
      setError("Something went wrong while saving and analyzing your file. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleLogout() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setRows([]);
    setFilename("");
  }

  const kpis = useMemo(() => computeKpis(rows), [rows]);

  const value: AppDataValue = {
    session,
    loadingInventory,
    analyzing,
    error,
    filename,
    rows,
    kpis,
    hasInventory: rows.length > 0,
    handleAnalyze,
    handleLogout,
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}

export { supabaseConfigured };
