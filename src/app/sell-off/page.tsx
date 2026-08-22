"use client";

import { useAppData } from "@/lib/AppDataContext";
import SellOffList from "@/components/SellOffList";

export default function SellOffPage() {
  const { rows } = useAppData();

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Sell Off</h1>
      <SellOffList rows={rows} />
    </div>
  );
}
