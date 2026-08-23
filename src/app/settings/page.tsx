"use client";

import { useAppData } from "@/lib/AppDataContext";

export default function SettingsPage() {
  const { session, warehouses, suppliers } = useAppData();

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Settings</h1>

      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-semibold text-slate-900">Account</h2>
        <p className="text-sm text-slate-500">Signed in as</p>
        <p className="mt-1 text-sm font-medium text-slate-800">{session?.user?.email ?? "—"}</p>
      </div>

      <div className="mb-6 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-semibold text-slate-900">Warehouses ({warehouses.length})</h2>
        {warehouses.length === 0 ? (
          <p className="text-sm text-slate-400">
            None yet — warehouses are created automatically the first time you add inventory to one.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {warehouses.map((w) => (
              <li key={w.id} className="py-2 text-sm">
                <p className="font-medium text-slate-800">{w.name}</p>
                {w.location && <p className="text-xs text-slate-400">{w.location}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="mb-3 font-semibold text-slate-900">Suppliers ({suppliers.length})</h2>
        {suppliers.length === 0 ? (
          <p className="text-sm text-slate-400">
            None yet — suppliers are created automatically the first time you reference one in an import or
            manual entry.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {suppliers.map((s) => (
              <li key={s.id} className="py-2 text-sm">
                <p className="font-medium text-slate-800">{s.name}</p>
                {s.contactInfo && <p className="text-xs text-slate-400">{s.contactInfo}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
