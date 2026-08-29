"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

const BUSINESS_TYPES = ["Pharmaceutical Distributor", "Medical Equipment Distributor", "Wholesaler", "Pharmacy Chain", "Other"];

export default function Setup() {
  const [companyName, setCompanyName] = useState("");
  const [businessType, setBusinessType] = useState(BUSINESS_TYPES[0]);
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
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
    // The app's auth listener picks up the updated session and moves
    // straight to the dashboard — no navigation needed here.
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm shadow-slate-200/60">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-base font-bold text-white shadow-sm">
            M
          </span>
          <h1 className="text-xl font-semibold tracking-tight text-slate-900">Set up your business</h1>
          <p className="mt-1 text-sm text-slate-500">Tell us a bit about your business — takes 30 seconds.</p>
        </div>

        {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-slate-700">Company name</span>
            <input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="e.g. Sunrise Pharma Distributors"
              autoFocus
              required
              className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-slate-700">Business type</span>
            <select
              value={businessType}
              onChange={(e) => setBusinessType(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30"
            >
              {BUSINESS_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-slate-700">
              Contact phone <span className="font-normal text-slate-400">(optional)</span>
            </span>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 shadow-sm outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30"
            />
          </label>

          <button
            type="submit"
            disabled={saving}
            className="mt-2 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm shadow-teal-600/20 transition-colors hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-teal-300"
          >
            {saving ? "Saving…" : "Continue to Dashboard"}
          </button>
        </form>
      </div>
    </div>
  );
}
