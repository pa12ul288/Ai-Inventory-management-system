"use client";

import { useAppData } from "@/lib/AppDataContext";
import InventoryTable from "@/components/InventoryTable";

export default function InventoryPage() {
  const { rows } = useAppData();

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Inventory</h1>
      <InventoryTable rows={rows} />
    </div>
  );
}
