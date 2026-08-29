"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, supabaseConfigured } from "./supabaseClient";
import {
  fetchInventoryRecords,
  fetchWarehouses,
  fetchSuppliers,
  fetchCustomers,
  fetchInvoices,
  commitReconciliation,
  addManualBatch,
  updateBatchStatuses,
  addInvoice,
  markInvoicePaid,
  type ManualBatchInput,
  type InvoiceInput,
} from "./inventoryData";
import { computeKpis } from "./kpis";
import type { BatchStatus, Customer, DashboardKpis, Invoice, InventoryRecord, ReconciliationSummary, Supplier, Warehouse } from "./types";

interface AppDataValue {
  session: Session | null | undefined;
  loadingInventory: boolean;
  records: InventoryRecord[];
  kpis: DashboardKpis;
  warehouses: Warehouse[];
  suppliers: Supplier[];
  customers: Customer[];
  invoices: Invoice[];
  hasInventory: boolean;
  refreshInventory: () => Promise<void>;
  handleManualAdd: (input: ManualBatchInput) => Promise<{ error: string | null }>;
  handleImportCommit: (summary: ReconciliationSummary, defaultWarehouseName: string) => Promise<{ error: string | null }>;
  handleUpdateBatchStatuses: (batchIds: string[], status: BatchStatus) => Promise<{ error: string | null }>;
  handleAddInvoice: (input: InvoiceInput) => Promise<{ error: string | null }>;
  handleMarkInvoicePaid: (invoiceId: string) => Promise<{ error: string | null }>;
  handleLogout: () => Promise<void>;
}

const AppDataContext = createContext<AppDataValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null | undefined>(() => (supabase ? undefined : null));
  const [loadingInventory, setLoadingInventory] = useState(false);
  const [records, setRecords] = useState<InventoryRecord[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  async function loadAll() {
    const [recs, whs, sups, custs, invs] = await Promise.all([
      fetchInventoryRecords(),
      fetchWarehouses(),
      fetchSuppliers(),
      fetchCustomers(),
      fetchInvoices(),
    ]);
    setRecords(recs);
    setWarehouses(whs);
    setSuppliers(sups);
    setCustomers(custs);
    setInvoices(invs);
  }

  // Inventory always loads from Supabase on sign-in, never from leftover
  // in-memory state.
  useEffect(() => {
    if (!session) return;
    let cancelled = false;

    (async () => {
      setLoadingInventory(true);
      try {
        await loadAll();
      } catch (e) {
        console.error("Failed to load inventory data from Supabase:", e);
      } finally {
        if (!cancelled) setLoadingInventory(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session]);

  async function handleManualAdd(input: ManualBatchInput) {
    const result = await addManualBatch(input);
    if (!result.error) await loadAll();
    return result;
  }

  async function handleImportCommit(summary: ReconciliationSummary, defaultWarehouseName: string) {
    const result = await commitReconciliation(summary, defaultWarehouseName);
    if (!result.error) await loadAll();
    return result;
  }

  async function handleUpdateBatchStatuses(batchIds: string[], status: BatchStatus) {
    const result = await updateBatchStatuses(batchIds, status);
    if (!result.error) await loadAll();
    return result;
  }

  async function handleAddInvoice(input: InvoiceInput) {
    const result = await addInvoice(input);
    if (!result.error) await loadAll();
    return result;
  }

  async function handleMarkInvoicePaid(invoiceId: string) {
    const result = await markInvoicePaid(invoiceId);
    if (!result.error) await loadAll();
    return result;
  }

  async function handleLogout() {
    if (!supabase) return;
    await supabase.auth.signOut();
    setRecords([]);
    setWarehouses([]);
    setSuppliers([]);
    setCustomers([]);
    setInvoices([]);
  }

  const kpis = useMemo(() => computeKpis(records), [records]);

  const value: AppDataValue = {
    session,
    loadingInventory,
    records,
    kpis,
    warehouses,
    suppliers,
    customers,
    invoices,
    hasInventory: records.length > 0,
    refreshInventory: loadAll,
    handleManualAdd,
    handleImportCommit,
    handleUpdateBatchStatuses,
    handleAddInvoice,
    handleMarkInvoicePaid,
    handleLogout,
  };

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppDataValue {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used within AppDataProvider");
  return ctx;
}

export { supabaseConfigured };
