"use client";

import { useAppData } from "@/lib/AppDataContext";
import ExpiryWatchList from "@/components/ExpiryWatchList";

export default function ExpiryPage() {
  const { rows } = useAppData();

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
      <h1 className="mb-2 text-2xl font-bold text-slate-900">Expiry Watch</h1>
      <p className="mb-6 text-sm text-slate-500">
        Products already expired or expiring within 60 days — act before this stock becomes an
        unsellable write-off.
      </p>
      <ExpiryWatchList rows={rows} />
    </div>
  );
}
