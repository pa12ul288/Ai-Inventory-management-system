import { supabase } from "./supabaseClient";
import type { ClassifiedInventoryRow, IdentifiedRow } from "./types";

export async function saveUpload(filename: string, rows: IdentifiedRow[]): Promise<string | null> {
  if (!supabase) return null;

  const { data: upload, error: uploadError } = await supabase
    .from("uploads")
    .insert({ filename, row_count: rows.length })
    .select("id")
    .single();

  if (uploadError || !upload) {
    console.error("Failed to save upload:", uploadError);
    return null;
  }

  const { error: itemsError } = await supabase.from("inventory_items").insert(
    rows.map((row) => ({
      id: row.id,
      upload_id: upload.id,
      product_name: row.productName,
      sku: row.sku || null,
      quantity_on_hand: row.quantityOnHand,
      cost_price: row.costPrice,
      last_sale_date: row.lastSaleDate,
      avg_daily_sales: row.avgDailySales,
    }))
  );

  if (itemsError) console.error("Failed to save inventory items:", itemsError);

  return upload.id;
}

export async function saveClassifications(rows: ClassifiedInventoryRow[]): Promise<void> {
  if (!supabase) return;

  await Promise.all(
    rows.map((row) =>
      supabase!
        .from("inventory_items")
        .update({
          days_in_stock: row.daysInStock,
          days_on_hand: row.daysOnHand,
          classification: row.classification,
        })
        .eq("id", row.id)
    )
  );
}
