"use client";

import { useAppData } from "@/lib/AppDataContext";
import KeepReorderList from "@/components/KeepReorderList";

export default function ReorderPage() {
  const { rows } = useAppData();

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Reorder</h1>
      <KeepReorderList rows={rows} />
    </div>
  );
}
