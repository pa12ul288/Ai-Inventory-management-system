"use client";

import { useMemo, useState } from "react";
import { useAppData } from "@/lib/AppDataContext";
import PageStats from "@/components/PageStats";
import { formatInr } from "@/lib/format";
import type { InvoiceStatus } from "@/lib/types";

interface CustomerRow {
  id: string;
  name: string;
  invoiceCount: number;
  totalBilled: number;
  outstanding: number;
  overdue: number;
  worstDaysOverdue: number;
}

const STATUS_STYLE: Record<InvoiceStatus, string> = {
  paid: "border-emerald-200 bg-emerald-50 text-emerald-700",
  pending: "border-slate-200 bg-slate-50 text-slate-600",
  overdue: "border-red-200 bg-red-50 text-red-700",
};

export default function CustomersPage() {
  const { customers, invoices, handleAddInvoice, handleMarkInvoicePaid } = useAppData();
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [issuedDate, setIssuedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const rows = useMemo(() => {
    const map = new Map<string, CustomerRow>();
    for (const c of customers) {
      map.set(c.id, { id: c.id, name: c.name, invoiceCount: 0, totalBilled: 0, outstanding: 0, overdue: 0, worstDaysOverdue: 0 });
    }
    for (const inv of invoices) {
      let row = map.get(inv.customerId);
      if (!row) {
        row = { id: inv.customerId, name: inv.customerName, invoiceCount: 0, totalBilled: 0, outstanding: 0, overdue: 0, worstDaysOverdue: 0 };
        map.set(inv.customerId, row);
      }
      row.invoiceCount += 1;
      row.totalBilled += inv.amount;
      if (inv.status !== "paid") row.outstanding += inv.amount;
      if (inv.status === "overdue") {
        row.overdue += inv.amount;
        row.worstDaysOverdue = Math.max(row.worstDaysOverdue, inv.daysOverdue ?? 0);
      }
    }
    return Array.from(map.values()).sort((a, b) => b.outstanding - a.outstanding);
  }, [customers, invoices]);

  const totalOutstanding = rows.reduce((s, r) => s + r.outstanding, 0);
  const totalOverdue = rows.reduce((s, r) => s + r.overdue, 0);
  const highRisk = rows.filter((r) => r.worstDaysOverdue > 30).length;

  const sortedInvoices = useMemo(
    () => [...invoices].sort((a, b) => (a.status === b.status ? 0 : a.status === "overdue" ? -1 : 1)),
    [invoices]
  );

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const amountNum = Number(amount);
    if (!name.trim() || !amountNum || amountNum <= 0) {
      setError("Enter a customer name and a positive amount.");
      return;
    }
    setSaving(true);
    const result = await handleAddInvoice({
      customerName: name.trim(),
      amount: amountNum,
      issuedDate,
      dueDate: dueDate || null,
    });
    setSaving(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setName("");
    setAmount("");
    setDueDate("");
  }

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
      <h1 className="mb-1 text-2xl font-bold text-slate-900">Customers</h1>
      <p className="mb-6 text-sm text-slate-500">Receivables by customer, from invoices you record here.</p>

      <PageStats
        items={[
          { label: "Customers", value: String(rows.length) },
          { label: "Outstanding", value: formatInr(totalOutstanding) },
          { label: "Overdue", value: formatInr(totalOverdue), accent: totalOverdue > 0 ? "text-red-600" : undefined },
          { label: "High-Risk Customers (30+ days overdue)", value: String(highRisk), accent: highRisk > 0 ? "text-amber-600" : undefined },
        ]}
      />

      <form onSubmit={onSubmit} className="mb-6 rounded-lg border border-slate-200 bg-white p-4">
        <p className="mb-3 text-sm font-semibold text-slate-800">Record a Sale on Credit</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Customer name"
            className="col-span-2 rounded-lg border border-slate-300 px-3 py-2 text-sm sm:col-span-1"
          />
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            type="number"
            min="0"
            step="0.01"
            placeholder="Amount (₹)"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            value={issuedDate}
            onChange={(e) => setIssuedDate(e.target.value)}
            type="date"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <input
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            type="date"
            placeholder="Due date"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-teal-600 px-3 py-2 text-sm font-medium text-white hover:bg-teal-700 disabled:opacity-60"
          >
            {saving ? "Saving..." : "Record Sale"}
          </button>
        </div>
        {error && <p className="mt-2 text-xs text-red-600">{error}</p>}
      </form>

      <div className="overflow-auto rounded-lg border border-slate-200">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2.5 text-left font-medium text-slate-600">Customer</th>
              <th className="px-3 py-2.5 text-right font-medium text-slate-600">Invoices</th>
              <th className="px-3 py-2.5 text-right font-medium text-slate-600">Total Billed</th>
              <th className="px-3 py-2.5 text-right font-medium text-slate-600">Outstanding</th>
              <th className="px-3 py-2.5 text-right font-medium text-slate-600">Overdue</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((r) => (
              <tr key={r.id} className="bg-white hover:bg-slate-50">
                <td className="px-3 py-2.5 font-medium text-slate-800">{r.name}</td>
                <td className="px-3 py-2.5 text-right text-slate-700">{r.invoiceCount}</td>
                <td className="px-3 py-2.5 text-right text-slate-700">{formatInr(r.totalBilled)}</td>
                <td className="px-3 py-2.5 text-right text-slate-800">{formatInr(r.outstanding)}</td>
                <td className={`px-3 py-2.5 text-right ${r.overdue > 0 ? "font-medium text-red-600" : "text-slate-400"}`}>
                  {r.overdue > 0 ? formatInr(r.overdue) : "—"}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-3 py-6 text-center text-sm text-slate-400">
                  No customers yet — record your first sale on credit above.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {sortedInvoices.length > 0 && (
        <div className="mt-6">
          <h2 className="mb-3 text-sm font-semibold text-slate-900">Invoices</h2>
          <div className="overflow-auto rounded-lg border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2.5 text-left font-medium text-slate-600">Customer</th>
                  <th className="px-3 py-2.5 text-right font-medium text-slate-600">Amount</th>
                  <th className="px-3 py-2.5 text-left font-medium text-slate-600">Issued</th>
                  <th className="px-3 py-2.5 text-left font-medium text-slate-600">Due</th>
                  <th className="px-3 py-2.5 text-left font-medium text-slate-600">Status</th>
                  <th className="px-3 py-2.5 text-right font-medium text-slate-600" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sortedInvoices.map((inv) => (
                  <tr key={inv.id} className="bg-white hover:bg-slate-50">
                    <td className="px-3 py-2.5 font-medium text-slate-800">{inv.customerName}</td>
                    <td className="px-3 py-2.5 text-right text-slate-700">{formatInr(inv.amount)}</td>
                    <td className="px-3 py-2.5 text-slate-600">{inv.issuedDate}</td>
                    <td className="px-3 py-2.5 text-slate-600">{inv.dueDate ?? "—"}</td>
                    <td className="px-3 py-2.5">
                      <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[inv.status]}`}>
                        {inv.status === "overdue" ? `Overdue · ${inv.daysOverdue}d` : inv.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {inv.status !== "paid" && (
                        <button
                          type="button"
                          onClick={() => handleMarkInvoicePaid(inv.id)}
                          className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
                        >
                          Mark Paid
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <p className="mt-4 text-xs text-slate-400">
        Customers and invoices are entered manually here — there&apos;s no automatic sync from an accounting system
        yet. Payment risk shown above (overdue amount and days) is computed directly from recorded due dates, not an
        AI prediction.
      </p>
    </div>
  );
}
