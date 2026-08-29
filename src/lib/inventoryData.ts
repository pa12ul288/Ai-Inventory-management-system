import { supabase } from "./supabaseClient";
import { computeExpiryStatus, computeStockStatus } from "./stockStatus";
import type { BatchStatus, Customer, Invoice, InventoryRecord, ReconciliationSummary, Supplier, Warehouse } from "./types";

export const DEFAULT_WAREHOUSE_NAME = "Default Warehouse";

const STATUS_MOVEMENT_TYPE: Record<BatchStatus, "adjustment" | "damage" | "expiry" | "quarantine" | "write_off"> = {
  active: "adjustment",
  quarantined: "quarantine",
  damaged: "damage",
  expired: "expiry",
  written_off: "write_off",
};

/** Bulk status change for one or more batches (e.g. quarantine a set of
 * batches after a QC flag). Logs a zero-quantity movement per batch so the
 * status change itself is traceable in the ledger, even though on-hand
 * quantity doesn't change. */
export async function updateBatchStatuses(batchIds: string[], status: BatchStatus): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase is not configured." };
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return { error: "Not signed in." };
  const userId = userData.user.id;

  const { data: batches, error: fetchError } = await supabase
    .from("inv_batches")
    .select("id, available_qty, warehouse_id")
    .in("id", batchIds);
  if (fetchError) return { error: fetchError.message };

  const { error: updateError } = await supabase
    .from("inv_batches")
    .update({ status, updated_at: new Date().toISOString() })
    .in("id", batchIds);
  if (updateError) return { error: updateError.message };

  const movements = (batches ?? []).map((b) => ({
    user_id: userId,
    batch_id: b.id,
    movement_type: STATUS_MOVEMENT_TYPE[status],
    quantity_change: 0,
    previous_qty: Number(b.available_qty),
    new_qty: Number(b.available_qty),
    reference: `Status changed to ${status}`,
    warehouse_id: b.warehouse_id,
  }));

  if (movements.length > 0) {
    const { error: movementError } = await supabase.from("inv_stock_movements").insert(movements);
    if (movementError) console.error("Failed to log status-change movements:", movementError);
  }

  return { error: null };
}

export async function fetchWarehouses(): Promise<Warehouse[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from("inv_warehouses").select("id, name, location").order("name");
  if (error) {
    console.error("Failed to fetch warehouses:", error);
    return [];
  }
  return (data ?? []).map((w) => ({ id: w.id, name: w.name, location: w.location }));
}

export async function fetchSuppliers(): Promise<Supplier[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from("inv_suppliers").select("id, name, contact_info").order("name");
  if (error) {
    console.error("Failed to fetch suppliers:", error);
    return [];
  }
  return (data ?? []).map((s) => ({ id: s.id, name: s.name, contactInfo: s.contact_info }));
}

/** The joined view the whole app renders: one row per batch, with
 * product/warehouse/supplier names resolved and status flags computed. */
export async function fetchInventoryRecords(): Promise<InventoryRecord[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("inv_batches")
    .select(
      `id, batch_number, manufacturing_date, expiry_date, quantity, available_qty,
       reserved_qty, damaged_qty, quarantined_qty, purchase_price, status, supplier_id,
       product_id, warehouse_id,
       products:inv_products ( sku, name, category, reorder_point, avg_daily_sales ),
       warehouses:inv_warehouses ( name ),
       suppliers:inv_suppliers ( name )`
    )
    .order("expiry_date", { ascending: true, nullsFirst: false });

  if (error) {
    console.error("Failed to fetch inventory records:", error);
    return [];
  }

  type BatchRow = {
    id: string;
    batch_number: string;
    manufacturing_date: string | null;
    expiry_date: string | null;
    quantity: number;
    available_qty: number;
    reserved_qty: number;
    damaged_qty: number;
    quarantined_qty: number;
    purchase_price: number;
    status: InventoryRecord["status"];
    supplier_id: string | null;
    product_id: string;
    warehouse_id: string;
    products: { sku: string; name: string; category: string | null; reorder_point: number; avg_daily_sales: number } | null;
    warehouses: { name: string } | null;
    suppliers: { name: string } | null;
  };

  return ((data ?? []) as unknown as BatchRow[]).map((b) => {
    const { daysToExpiry, expiryStatus } = computeExpiryStatus(b.expiry_date);
    const availableQty = Number(b.available_qty);
    const reorderPoint = Number(b.products?.reorder_point ?? 0);
    const avgDailySales = Number(b.products?.avg_daily_sales ?? 0);

    return {
      batchId: b.id,
      productId: b.product_id,
      productName: b.products?.name ?? "Unknown product",
      sku: b.products?.sku ?? "",
      category: b.products?.category ?? null,
      warehouseId: b.warehouse_id,
      warehouseName: b.warehouses?.name ?? "Unknown",
      batchNumber: b.batch_number,
      manufacturingDate: b.manufacturing_date,
      expiryDate: b.expiry_date,
      quantity: Number(b.quantity),
      availableQty,
      reservedQty: Number(b.reserved_qty),
      damagedQty: Number(b.damaged_qty),
      quarantinedQty: Number(b.quarantined_qty),
      purchasePrice: Number(b.purchase_price),
      value: availableQty * Number(b.purchase_price),
      supplierId: b.supplier_id,
      supplierName: b.suppliers?.name ?? null,
      status: b.status,
      daysToExpiry,
      expiryStatus,
      reorderPoint,
      avgDailySales,
      stockStatus: computeStockStatus(availableQty, reorderPoint, avgDailySales),
    };
  });
}

export interface ReconciliationLookups {
  products: { id: string; sku: string; name: string }[];
  batches: { id: string; productId: string; warehouseName: string; batchNumber: string }[];
}

/** Snapshot of what already exists, for the reconciliation engine to diff
 * an uploaded file against. */
export async function fetchReconciliationLookups(): Promise<ReconciliationLookups> {
  if (!supabase) return { products: [], batches: [] };

  const [{ data: products, error: productsError }, { data: batches, error: batchesError }] = await Promise.all([
    supabase.from("inv_products").select("id, sku, name"),
    supabase.from("inv_batches").select("id, product_id, batch_number, warehouses:inv_warehouses ( name )"),
  ]);

  if (productsError) console.error("Failed to fetch products for reconciliation:", productsError);
  if (batchesError) console.error("Failed to fetch batches for reconciliation:", batchesError);

  type BatchLookupRow = { id: string; product_id: string; batch_number: string; warehouses: { name: string } | null };

  return {
    products: (products ?? []).map((p) => ({ id: p.id, sku: p.sku, name: p.name })),
    batches: ((batches ?? []) as unknown as BatchLookupRow[]).map((b) => ({
      id: b.id,
      productId: b.product_id,
      warehouseName: b.warehouses?.name ?? "",
      batchNumber: b.batch_number,
    })),
  };
}

async function getOrCreateByName(
  table: "inv_warehouses" | "inv_suppliers",
  userId: string,
  name: string
): Promise<string> {
  const { data: existing } = await supabase!
    .from(table)
    .select("id")
    .eq("user_id", userId)
    .ilike("name", name)
    .maybeSingle();
  if (existing) return existing.id;

  const label = table === "inv_warehouses" ? "warehouse" : "supplier";
  const { data, error } = await supabase!.from(table).insert({ user_id: userId, name }).select("id").single();
  if (error || !data) throw error ?? new Error(`Failed to create ${label}`);
  return data.id;
}

function resolveSku(sku: string, productName: string): string {
  return sku.trim() || `NOSKU-${productName.trim().toUpperCase().replace(/\s+/g, "-")}`;
}

/** Writes a reviewed ReconciliationSummary to the database: creates
 * products/batches for new_product and new_batch rows, updates existing
 * batches for update_batch rows (replacing quantity with the file's value,
 * since a reconciled bulk sheet represents "this is the current truth"),
 * and records a stock_movements row for every batch touched. Duplicate and
 * error rows are skipped entirely. */
export async function commitReconciliation(
  summary: ReconciliationSummary,
  defaultWarehouseName: string
): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase is not configured." };
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return { error: "Not signed in." };
  const userId = userData.user.id;

  const warehouseCache = new Map<string, string>();
  const supplierCache = new Map<string, string>();

  async function resolveWarehouseId(name: string): Promise<string> {
    const key = name.toLowerCase();
    if (!warehouseCache.has(key)) warehouseCache.set(key, await getOrCreateByName("inv_warehouses", userId, name));
    return warehouseCache.get(key)!;
  }

  async function resolveSupplierId(name: string | null): Promise<string | null> {
    if (!name) return null;
    const key = name.toLowerCase();
    if (!supplierCache.has(key)) supplierCache.set(key, await getOrCreateByName("inv_suppliers", userId, name));
    return supplierCache.get(key)!;
  }

  try {
    for (const item of summary.items) {
      if (item.action === "duplicate" || item.action === "error") continue;

      const row = item.row;
      const warehouseName = row.warehouseName || defaultWarehouseName;
      const warehouseId = await resolveWarehouseId(warehouseName);
      const supplierId = await resolveSupplierId(row.supplierName);

      let productId = item.existingProductId ?? null;

      if (item.action === "new_product") {
        const { data: product, error: productError } = await supabase
          .from("inv_products")
          .upsert(
            {
              user_id: userId,
              sku: resolveSku(row.sku, row.productName),
              name: row.productName,
              category: row.category,
              default_supplier_id: supplierId,
            },
            { onConflict: "user_id,sku" }
          )
          .select("id")
          .single();
        if (productError || !product) throw productError ?? new Error("Failed to create product");
        productId = product.id;
      }

      if (!productId) throw new Error(`Missing product for row ${item.rowIndex + 1}`);

      if (item.action === "new_product" || item.action === "new_batch") {
        const { data: batch, error: batchError } = await supabase
          .from("inv_batches")
          .insert({
            user_id: userId,
            product_id: productId,
            warehouse_id: warehouseId,
            batch_number: row.batchNumber || "UNSPECIFIED",
            manufacturing_date: row.manufacturingDate,
            expiry_date: row.expiryDate,
            quantity: row.quantity,
            available_qty: row.quantity,
            purchase_price: row.purchasePrice,
            supplier_id: supplierId,
            status: "active",
          })
          .select("id")
          .single();
        if (batchError || !batch) throw batchError ?? new Error("Failed to create batch");

        await supabase.from("inv_stock_movements").insert({
          user_id: userId,
          batch_id: batch.id,
          movement_type: "import",
          quantity_change: row.quantity,
          previous_qty: 0,
          new_qty: row.quantity,
          reference: "Excel/CSV import",
          warehouse_id: warehouseId,
        });
      } else if (item.action === "update_batch" && item.existingBatchId) {
        const { data: existingBatch, error: fetchError } = await supabase
          .from("inv_batches")
          .select("available_qty")
          .eq("id", item.existingBatchId)
          .single();
        if (fetchError || !existingBatch) throw fetchError ?? new Error("Batch not found");

        const previousQty = Number(existingBatch.available_qty);

        const { error: updateError } = await supabase
          .from("inv_batches")
          .update({
            quantity: row.quantity,
            available_qty: row.quantity,
            purchase_price: row.purchasePrice,
            manufacturing_date: row.manufacturingDate,
            expiry_date: row.expiryDate,
            supplier_id: supplierId,
            updated_at: new Date().toISOString(),
          })
          .eq("id", item.existingBatchId);
        if (updateError) throw updateError;

        await supabase.from("inv_stock_movements").insert({
          user_id: userId,
          batch_id: item.existingBatchId,
          movement_type: "import",
          quantity_change: row.quantity - previousQty,
          previous_qty: previousQty,
          new_qty: row.quantity,
          reference: "Excel/CSV import (reconciled)",
          warehouse_id: warehouseId,
        });
      }
    }

    return { error: null };
  } catch (err) {
    console.error("Failed to commit reconciliation:", err);
    return { error: err instanceof Error ? err.message : "Import failed" };
  }
}

export async function fetchCustomers(): Promise<Customer[]> {
  if (!supabase) return [];
  const { data, error } = await supabase.from("inv_customers").select("id, name, contact_info").order("name");
  if (error) {
    console.error("Failed to fetch customers:", error);
    return [];
  }
  return (data ?? []).map((c) => ({ id: c.id, name: c.name, contactInfo: c.contact_info }));
}

function computeInvoiceStatus(dueDate: string | null, paidDate: string | null): { status: Invoice["status"]; daysOverdue: number | null } {
  if (paidDate) return { status: "paid", daysOverdue: null };
  if (!dueDate) return { status: "pending", daysOverdue: null };
  const due = new Date(dueDate);
  const today = new Date();
  due.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  const diffDays = Math.round((today.getTime() - due.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays > 0) return { status: "overdue", daysOverdue: diffDays };
  return { status: "pending", daysOverdue: null };
}

export async function fetchInvoices(): Promise<Invoice[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("inv_invoices")
    .select("id, customer_id, amount, issued_date, due_date, paid_date, notes, customers:inv_customers ( name )")
    .order("issued_date", { ascending: false });
  if (error) {
    console.error("Failed to fetch invoices:", error);
    return [];
  }

  type InvoiceRow = {
    id: string;
    customer_id: string;
    amount: number;
    issued_date: string;
    due_date: string | null;
    paid_date: string | null;
    notes: string | null;
    customers: { name: string } | null;
  };

  return ((data ?? []) as unknown as InvoiceRow[]).map((inv) => {
    const { status, daysOverdue } = computeInvoiceStatus(inv.due_date, inv.paid_date);
    return {
      id: inv.id,
      customerId: inv.customer_id,
      customerName: inv.customers?.name ?? "Unknown customer",
      amount: Number(inv.amount),
      issuedDate: inv.issued_date,
      dueDate: inv.due_date,
      paidDate: inv.paid_date,
      notes: inv.notes,
      status,
      daysOverdue,
    };
  });
}

export interface InvoiceInput {
  customerName: string;
  amount: number;
  issuedDate: string;
  dueDate: string | null;
}

/** Records a sale on credit for a customer, creating the customer if this
 * is their first invoice. */
export async function addInvoice(input: InvoiceInput): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase is not configured." };
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return { error: "Not signed in." };
  const userId = userData.user.id;

  try {
    const { data: existing } = await supabase
      .from("inv_customers")
      .select("id")
      .eq("user_id", userId)
      .ilike("name", input.customerName)
      .maybeSingle();

    let customerId = existing?.id as string | undefined;
    if (!customerId) {
      const { data: customer, error: customerError } = await supabase
        .from("inv_customers")
        .insert({ user_id: userId, name: input.customerName })
        .select("id")
        .single();
      if (customerError || !customer) throw customerError ?? new Error("Failed to create customer");
      customerId = customer.id;
    }

    const { error: invoiceError } = await supabase.from("inv_invoices").insert({
      user_id: userId,
      customer_id: customerId,
      amount: input.amount,
      issued_date: input.issuedDate,
      due_date: input.dueDate,
    });
    if (invoiceError) throw invoiceError;

    return { error: null };
  } catch (err) {
    console.error("Failed to add invoice:", err);
    return { error: err instanceof Error ? err.message : "Failed to save" };
  }
}

export async function markInvoicePaid(invoiceId: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase is not configured." };
  const { error } = await supabase
    .from("inv_invoices")
    .update({ paid_date: new Date().toISOString().slice(0, 10) })
    .eq("id", invoiceId);
  return { error: error ? error.message : null };
}

export interface ManualBatchInput {
  productName: string;
  sku: string;
  batchNumber: string;
  warehouseName: string;
  manufacturingDate: string | null;
  expiryDate: string | null;
  quantity: number;
  purchasePrice: number;
  supplierName: string | null;
  category: string | null;
}

/** Manual "Add Inventory" entry. Unlike a reconciled import (which treats
 * the file as the current truth and replaces quantity), a manual entry for
 * a batch that already exists is treated as a receipt: the quantity is
 * added to what's already there. */
export async function addManualBatch(input: ManualBatchInput): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Supabase is not configured." };
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return { error: "Not signed in." };
  const userId = userData.user.id;

  try {
    const warehouseId = await getOrCreateByName("inv_warehouses", userId, input.warehouseName || DEFAULT_WAREHOUSE_NAME);
    const supplierId = input.supplierName ? await getOrCreateByName("inv_suppliers", userId, input.supplierName) : null;
    const sku = resolveSku(input.sku, input.productName);

    const { data: existingProduct } = await supabase
      .from("inv_products")
      .select("id")
      .eq("user_id", userId)
      .eq("sku", sku)
      .maybeSingle();

    let productId = existingProduct?.id as string | undefined;
    if (!productId) {
      const { data: product, error: productError } = await supabase
        .from("inv_products")
        .insert({ user_id: userId, sku, name: input.productName, category: input.category, default_supplier_id: supplierId })
        .select("id")
        .single();
      if (productError || !product) throw productError ?? new Error("Failed to create product");
      productId = product.id;
    }

    const batchNumber = input.batchNumber || "UNSPECIFIED";

    const { data: existingBatch } = await supabase
      .from("inv_batches")
      .select("id, available_qty")
      .eq("user_id", userId)
      .eq("product_id", productId)
      .eq("warehouse_id", warehouseId)
      .eq("batch_number", batchNumber)
      .maybeSingle();

    if (existingBatch) {
      const previousQty = Number(existingBatch.available_qty);
      const newQty = previousQty + input.quantity;

      const { error: updateError } = await supabase
        .from("inv_batches")
        .update({ quantity: newQty, available_qty: newQty, updated_at: new Date().toISOString() })
        .eq("id", existingBatch.id);
      if (updateError) throw updateError;

      await supabase.from("inv_stock_movements").insert({
        user_id: userId,
        batch_id: existingBatch.id,
        movement_type: "receipt",
        quantity_change: input.quantity,
        previous_qty: previousQty,
        new_qty: newQty,
        reference: "Manual entry",
        warehouse_id: warehouseId,
      });
    } else {
      const { data: batch, error: batchError } = await supabase
        .from("inv_batches")
        .insert({
          user_id: userId,
          product_id: productId,
          warehouse_id: warehouseId,
          batch_number: batchNumber,
          manufacturing_date: input.manufacturingDate,
          expiry_date: input.expiryDate,
          quantity: input.quantity,
          available_qty: input.quantity,
          purchase_price: input.purchasePrice,
          supplier_id: supplierId,
          status: "active",
        })
        .select("id")
        .single();
      if (batchError || !batch) throw batchError ?? new Error("Failed to create batch");

      await supabase.from("inv_stock_movements").insert({
        user_id: userId,
        batch_id: batch.id,
        movement_type: "receipt",
        quantity_change: input.quantity,
        previous_qty: 0,
        new_qty: input.quantity,
        reference: "Manual entry",
        warehouse_id: warehouseId,
      });
    }

    return { error: null };
  } catch (err) {
    console.error("Failed to add manual batch:", err);
    return { error: err instanceof Error ? err.message : "Failed to save" };
  }
}
