"use client";

import Link from "next/link";
import { useAppData } from "@/lib/AppDataContext";

export default function SettingsPage() {
  const { session, warehouses, suppliers, customers, records } = useAppData();

  const memberSince = session?.user?.created_at ? new Date(session.user.created_at).toLocaleDateString() : "—";

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Settings</h1>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/40 p-5">
        <h2 className="mb-3 font-semibold text-slate-900">Company Profile</h2>
        <dl className="grid grid-cols-2 gap-y-2 text-sm">
          <dt className="text-slate-500">Account email</dt>
          <dd className="text-right font-medium text-slate-800">{session?.user?.email ?? "—"}</dd>
          <dt className="text-slate-500">Member since</dt>
          <dd className="text-right font-medium text-slate-800">{memberSince}</dd>
          <dt className="text-slate-500">Warehouses</dt>
          <dd className="text-right font-medium text-slate-800">{warehouses.length}</dd>
          <dt className="text-slate-500">Suppliers</dt>
          <dd className="text-right font-medium text-slate-800">{suppliers.length}</dd>
          <dt className="text-slate-500">Customers</dt>
          <dd className="text-right font-medium text-slate-800">{customers.length}</dd>
          <dt className="text-slate-500">Products tracked</dt>
          <dd className="text-right font-medium text-slate-800">{new Set(records.map((r) => r.productId)).size}</dd>
        </dl>
        <p className="mt-3 text-xs text-slate-400">
          There&apos;s one account per business right now, so this doubles as the company profile — no separate
          company-name/logo fields are stored yet.
        </p>
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/40 p-5">
        <h2 className="mb-1 font-semibold text-slate-900">Data Import (Tally / Excel / CSV)</h2>
        <p className="mb-3 text-sm text-slate-500">
          Stock is kept current by uploading an export from Tally (or any spreadsheet) — there&apos;s no live API
          connection, so nothing syncs automatically in the background.
        </p>
        <div className="flex gap-2">
          <Link
            href="/inventory/add"
            className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-700"
          >
            Import a File
          </Link>
          <Link
            href="/data-sync"
            className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            View Import History
          </Link>
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/40 p-5">
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

      <div className="rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/40 p-5">
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

      <p className="mt-6 text-xs text-slate-400">
        Multi-user roles/permissions, notification preferences, and AI-tuning controls aren&apos;t built yet — this
        is a single-account system with deterministic (non-configurable) status rules. Let me know if any of those
        would actually be useful to you and I&apos;ll build them for real rather than as placeholders.
      </p>
    </div>
  );
}
