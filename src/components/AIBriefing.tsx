"use client";

import { useEffect, useState } from "react";
import { SparkleIcon } from "./icons";
import type { BriefingInput } from "@/app/api/briefing/route";

export default function AIBriefing({ input }: { input: BriefingInput }) {
  const [briefing, setBriefing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/briefing", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error ?? "AI briefing unavailable right now.");
        } else {
          setBriefing(data.briefing);
        }
      } catch {
        if (!cancelled) setError("AI briefing unavailable right now.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    input.totalInventoryValue,
    input.capitalAtRisk,
    input.outOfStockCount,
    input.lowStockCount,
    input.nearExpiryCount,
    input.expiredCount,
    input.overdueReceivablesCount,
  ]);

  if (error) return null;

  return (
    <div className="mb-6 rounded-xl border border-teal-100 bg-gradient-to-br from-teal-50 to-white p-4 shadow-sm shadow-slate-200/40">
      <div className="mb-1.5 flex items-center gap-2">
        <SparkleIcon className="h-4 w-4 text-teal-600" />
        <p className="text-xs font-semibold uppercase tracking-wider text-teal-700">AI Briefing</p>
      </div>
      {loading ? (
        <div className="flex flex-col gap-1.5">
          <div className="h-3.5 w-11/12 animate-pulse rounded bg-teal-100/70" />
          <div className="h-3.5 w-3/4 animate-pulse rounded bg-teal-100/70" />
        </div>
      ) : (
        <p className="text-sm leading-relaxed text-slate-700">{briefing}</p>
      )}
    </div>
  );
}
