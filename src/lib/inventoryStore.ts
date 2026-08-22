import { supabase } from "./supabaseClient";
import type { IdentifiedRow, RawInventoryRow } from "./types";

/** sku_code is the upsert key. Rows without a SKU still need a stable,
 * per-product identity so re-uploads update rather than duplicate them. */
function resolveSkuCode(row: RawInventoryRow): string {
  const trimmed = row.sku?.trim();
  if (trimmed) return trimmed.toUpperCase();
  return `NOSKU-${row.productName.trim().toUpperCase().replace(/\s+/g, "-")}`;
}

export async function fetchInventory(): Promise<IdentifiedRow[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("inventory")
    .select(
      "id, sku_code, product_name, quantity_on_hand, cost_price, last_sale_date, avg_daily_sales, expiry_date"
    )
    .order("product_name", { ascending: true });

  if (error) {
    console.error("Failed to fetch inventory from Supabase:", error);
    return [];
  }

  return (data ?? []).map((r) => ({
    id: r.id,
    productName: r.product_name,
    sku: r.sku_code,
    quantityOnHand: Number(r.quantity_on_hand),
    costPrice: Number(r.cost_price),
    lastSaleDate: r.last_sale_date,
    avgDailySales: Number(r.avg_daily_sales),
    expiryDate: r.expiry_date,
  }));
}

/** Upserts on (user_id, sku_code): new SKUs are added, existing ones are
 * updated in place, and rows for SKUs absent from this file are left alone. */
export async function upsertInventory(rows: RawInventoryRow[]): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase is not configured." };

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return { error: "Not signed in." };

  const userId = userData.user.id;
  const nowIso = new Date().toISOString();

  const payload = rows.map((row) => ({
    user_id: userId,
    sku_code: resolveSkuCode(row),
    product_name: row.productName,
    quantity_on_hand: row.quantityOnHand,
    cost_price: row.costPrice,
    last_sale_date: row.lastSaleDate,
    avg_daily_sales: row.avgDailySales,
    expiry_date: row.expiryDate,
    updated_at: nowIso,
  }));

  const { error } = await supabase.from("inventory").upsert(payload, { onConflict: "user_id,sku_code" });

  if (error) {
    console.error("Failed to upsert inventory into Supabase:", error);
    return { error: error.message };
  }

  return { error: null };
}
