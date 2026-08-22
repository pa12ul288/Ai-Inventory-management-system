"use client";

import { useAppData } from "@/lib/AppDataContext";
import ExpiryWatchList from "@/components/ExpiryWatchList";
import PageStats from "@/components/PageStats";
import { formatInr } from "@/lib/format";

export default function ExpiryPage() {
  const { rows, kpis } = useAppData();

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
      <h1 className="mb-2 text-2xl font-bold text-slate-900">Expiry Watch</h1>
      <p className="mb-6 text-sm text-slate-500">
        Products already expired or expiring within 60 days — act before this stock becomes an
        unsellable write-off.
      </p>
      <PageStats
        items={[
          { label: "Expired", value: String(kpis.expiredCount), accent: "text-red-600" },
          { label: "Expired Value", value: formatInr(kpis.expiredValue), accent: "text-red-600" },
          { label: "Expiring Soon", value: String(kpis.expiringSoonCount), accent: "text-amber-600" },
          { label: "Expiring Soon Value", value: formatInr(kpis.expiringSoonValue), accent: "text-amber-600" },
        ]}
      />
      <ExpiryWatchList rows={rows} />
    </div>
  );
}
