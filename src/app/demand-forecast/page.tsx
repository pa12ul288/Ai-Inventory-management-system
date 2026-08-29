"use client";

import { useMemo, useState } from "react";
import { useAppData } from "@/lib/AppDataContext";
import PageStats from "@/components/PageStats";
import { formatInr } from "@/lib/format";

const PERIODS = [
  { label: "7 days", days: 7 },
  { label: "30 days", days: 30 },
  { label: "90 days", days: 90 },
];

interface ProductAgg {
  productId: string;
  productName: string;
  sku: string;
  availableQty: number;
  avgDailySales: number;
  purchasePrice: number;
}

export default function DemandForecastPage() {
  const { records } = useAppData();
  const [periodDays, setPeriodDays] = useState(30);

  const products = useMemo(() => {
    const map = new Map<string, ProductAgg>();
    for (const r of records) {
      let p = map.get(r.productId);
      if (!p) {
        p = { productId: r.productId, productName: r.productName, sku: r.sku, availableQty: 0, avgDailySales: r.avgDailySales, purchasePrice: r.purchasePrice };
        map.set(r.productId, p);
      }
      p.availableQty += r.availableQty;
    }
    return Array.from(map.values())
      .filter((p) => p.avgDailySales > 0)
      .map((p) => {
        const projectedDemand = p.avgDailySales * periodDays;
        const daysOfStock = p.avgDailySales > 0 ? p.availableQty / p.avgDailySales : Infinity;
        const shortfall = Math.max(0, projectedDemand - p.availableQty);
        return { ...p, projectedDemand, daysOfStock, shortfall };
      })
      .sort((a, b) => b.shortfall - a.shortfall);
  }, [records, periodDays]);

  const totalNoSalesHistory = records.length > 0
    ? new Set(records.filter((r) => r.avgDailySales === 0).map((r) => r.productId)).size
    : 0;

  const willRunOut = products.filter((p) => p.daysOfStock < periodDays).length;
  const totalShortfallValue = products.reduce((s, p) => s + p.shortfall * p.purchasePrice, 0);

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
      <h1 className="mb-1 text-2xl font-bold text-slate-900">Demand Forecast</h1>
      <p className="mb-6 text-sm text-slate-500">
        A straight-line projection from each product&apos;s average daily sales — not a machine-learning model. No
        historical sales time series is stored yet, so trend/seasonality can&apos;t be modeled honestly.
      </p>

      <div className="mb-4 flex gap-2">
        {PERIODS.map((p) => (
          <button
            key={p.days}
            type="button"
            onClick={() => setPeriodDays(p.days)}
            className={`rounded-lg border px-3 py-1.5 text-sm font-medium ${
              periodDays === p.days ? "border-teal-600 bg-teal-50 text-teal-700" : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <PageStats
        items={[
          { label: "Products with Sales History", value: String(products.length) },
          { label: `Projected to Run Out (${periodDays}d)`, value: String(willRunOut), accent: willRunOut > 0 ? "text-red-600" : undefined },
          { label: "Projected Shortfall Value", value: formatInr(totalShortfallValue), accent: totalShortfallValue > 0 ? "text-amber-600" : undefined },
          { label: "No Sales History Recorded", value: String(totalNoSalesHistory) },
        ]}
      />

      <div className="overflow-auto rounded-xl border border-slate-200 shadow-sm shadow-slate-200/40">
        <table className="min-w-full divide-y divide-slate-200 text-sm">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-3 py-2.5 text-left font-medium text-slate-600">Product</th>
              <th className="px-3 py-2.5 text-right font-medium text-slate-600">In Stock</th>
              <th className="px-3 py-2.5 text-right font-medium text-slate-600">Avg Daily Sales</th>
              <th className="px-3 py-2.5 text-right font-medium text-slate-600">Projected Demand ({periodDays}d)</th>
              <th className="px-3 py-2.5 text-right font-medium text-slate-600">Days of Stock Left</th>
              <th className="px-3 py-2.5 text-right font-medium text-slate-600">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {products.map((p) => (
              <tr key={p.productId} className="bg-white hover:bg-slate-50">
                <td className="px-3 py-2.5">
                  <p className="font-medium text-slate-800">{p.productName}</p>
                  <p className="text-xs text-slate-400">{p.sku}</p>
                </td>
                <td className="px-3 py-2.5 text-right text-slate-700">{p.availableQty}</td>
                <td className="px-3 py-2.5 text-right text-slate-700">{p.avgDailySales.toFixed(1)}/day</td>
                <td className="px-3 py-2.5 text-right text-slate-700">{Math.round(p.projectedDemand)}</td>
                <td className="px-3 py-2.5 text-right text-slate-700">
                  {p.daysOfStock === Infinity ? "—" : Math.round(p.daysOfStock)}
                </td>
                <td className="px-3 py-2.5 text-right">
                  {p.shortfall > 0 ? (
                    <span className="rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-xs font-medium text-red-700">
                      Reorder
                    </span>
                  ) : (
                    <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
                      Sufficient
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-6 text-center text-sm text-slate-400">
                  No products with recorded sales history yet — forecasting needs avg_daily_sales &gt; 0 on at least
                  one batch.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
