"use client";

import { useState } from "react";
import Link from "next/link";
import { useAppData } from "@/lib/AppDataContext";
import { supabase } from "@/lib/supabaseClient";

const BUSINESS_TYPES = ["Pharmaceutical Distributor", "Medical Equipment Distributor", "Wholesaler", "Pharmacy Chain", "Other"];

export default function SettingsPage() {
  const { session, warehouses, suppliers, customers, records, refreshInventory } = useAppData();
  const metadata = session?.user?.user_metadata ?? {};

  const [editing, setEditing] = useState(false);
  const [companyName, setCompanyName] = useState(metadata.company_name ?? "");
  const [businessType, setBusinessType] = useState(metadata.business_type ?? BUSINESS_TYPES[0]);
  const [phone, setPhone] = useState(metadata.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const memberSince = session?.user?.created_at ? new Date(session.user.created_at).toLocaleDateString() : "—";

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!supabase) return;
    if (!companyName.trim()) {
      setError("Company name is required.");
      return;
    }
    setSaving(true);
    setError(null);
    const { error: updateError } = await supabase.auth.updateUser({
      data: { company_name: companyName.trim(), business_type: businessType, phone: phone.trim() || null },
    });
    setSaving(false);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setEditing(false);
    await refreshInventory();
  }

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-6 sm:px-6 sm:py-8">
      <h1 className="mb-6 text-2xl font-bold text-slate-900">Settings</h1>

      <div className="mb-6 rounded-xl border border-slate-200 bg-white shadow-sm shadow-slate-200/40 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-semibold text-slate-900">Company Profile</h2>
          {!editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Edit
            </button>
          )}
        </div>

        {editing ? (
          <form onSubmit={saveProfile} className="flex flex-col gap-3">
            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>}
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">Company name</span>
              <input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">Business type</span>
              <select
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30"
              >
                {BUSINESS_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">Contact phone</span>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30"
              />
            </label>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-teal-700 disabled:opacity-60"
              >
                {saving ? "Saving…" : "Save"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <dl className="grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-slate-500">Company name</dt>
            <dd className="text-right font-medium text-slate-800">{metadata.company_name ?? "—"}</dd>
            <dt className="text-slate-500">Business type</dt>
            <dd className="text-right font-medium text-slate-800">{metadata.business_type ?? "—"}</dd>
            <dt className="text-slate-500">Contact phone</dt>
            <dd className="text-right font-medium text-slate-800">{metadata.phone ?? "—"}</dd>
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
        )}
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
