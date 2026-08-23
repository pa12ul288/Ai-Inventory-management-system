"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppData } from "@/lib/AppDataContext";
import { DEFAULT_WAREHOUSE_NAME } from "@/lib/inventoryData";

const EMPTY = {
  productName: "",
  sku: "",
  category: "",
  batchNumber: "",
  warehouseName: "",
  manufacturingDate: "",
  expiryDate: "",
  quantity: "",
  purchasePrice: "",
  supplierName: "",
};

export default function ManualEntryForm() {
  const router = useRouter();
  const { warehouses, suppliers, handleManualAdd } = useAppData();
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function set<K extends keyof typeof EMPTY>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
    setSuccess(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const quantity = parseFloat(form.quantity);
    if (!form.productName.trim()) return setError("Product name is required.");
    if (!Number.isFinite(quantity) || quantity <= 0) return setError("Quantity must be greater than zero.");
    if (form.manufacturingDate && form.expiryDate && form.manufacturingDate > form.expiryDate) {
      return setError("Manufacturing date cannot be after the expiry date.");
    }

    setSaving(true);
    const result = await handleManualAdd({
      productName: form.productName.trim(),
      sku: form.sku.trim(),
      batchNumber: form.batchNumber.trim(),
      warehouseName: form.warehouseName.trim() || DEFAULT_WAREHOUSE_NAME,
      manufacturingDate: form.manufacturingDate || null,
      expiryDate: form.expiryDate || null,
      quantity,
      purchasePrice: parseFloat(form.purchasePrice) || 0,
      supplierName: form.supplierName.trim() || null,
      category: form.category.trim() || null,
    });
    setSaving(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setSuccess(true);
    setForm(EMPTY);
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-slate-200 bg-white p-6">
      {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {success && (
        <p className="mb-4 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Saved. A stock movement was recorded for this batch.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Product Name" required value={form.productName} onChange={(v) => set("productName", v)} />
        <Field label="SKU" value={form.sku} onChange={(v) => set("sku", v)} hint="Auto-generated from the name if left blank" />
        <Field label="Category" value={form.category} onChange={(v) => set("category", v)} />
        <Field label="Batch Number" value={form.batchNumber} onChange={(v) => set("batchNumber", v)} />
        <Field
          label="Warehouse"
          value={form.warehouseName}
          onChange={(v) => set("warehouseName", v)}
          list="warehouse-options"
          hint={`Defaults to "${DEFAULT_WAREHOUSE_NAME}" if left blank`}
        />
        <Field label="Supplier" value={form.supplierName} onChange={(v) => set("supplierName", v)} list="supplier-options" />
        <Field label="Manufacturing Date" type="date" value={form.manufacturingDate} onChange={(v) => set("manufacturingDate", v)} />
        <Field label="Expiry Date" type="date" value={form.expiryDate} onChange={(v) => set("expiryDate", v)} />
        <Field label="Quantity" type="number" required value={form.quantity} onChange={(v) => set("quantity", v)} />
        <Field label="Purchase Price (per unit)" type="number" value={form.purchasePrice} onChange={(v) => set("purchasePrice", v)} />
      </div>

      <datalist id="warehouse-options">
        {warehouses.map((w) => (
          <option key={w.id} value={w.name} />
        ))}
      </datalist>
      <datalist id="supplier-options">
        {suppliers.map((s) => (
          <option key={s.id} value={s.name} />
        ))}
      </datalist>

      <div className="mt-6 flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:bg-teal-300"
        >
          {saving ? "Saving…" : "Add to Inventory"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/inventory")}
          className="rounded-lg border border-slate-300 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          View Inventory
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  required,
  list,
  hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
  list?: string;
  hint?: string;
}) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        list={list}
        min={type === "number" ? 0 : undefined}
        step={type === "number" ? "any" : undefined}
        className="rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition-colors focus:border-teal-500 focus:ring-1 focus:ring-teal-500"
      />
      {hint && <span className="text-xs text-slate-400">{hint}</span>}
    </label>
  );
}
