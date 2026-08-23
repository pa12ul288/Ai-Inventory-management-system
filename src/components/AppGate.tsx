"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import type { ReactNode } from "react";
import AppShell from "./AppShell";
import Login from "./Login";
import { useAppData, supabaseConfigured } from "@/lib/AppDataContext";

export default function AppGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { session, loadingInventory, hasInventory } = useAppData();

  if (!supabaseConfigured) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-white px-6 text-center">
        <p className="max-w-md text-sm text-slate-500">
          Supabase isn&apos;t configured yet. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
          to your environment to enable login and inventory storage.
        </p>
      </div>
    );
  }

  if (session === undefined) {
    return <div className="flex min-h-screen w-full items-center justify-center bg-white text-slate-400">Loading…</div>;
  }

  if (!session) {
    return <Login />;
  }

  if (loadingInventory) {
    return (
      <AppShell>
        <div className="flex flex-1 items-center justify-center text-slate-400">Loading your inventory…</div>
      </AppShell>
    );
  }

  // First-time experience: nothing added yet. Let /inventory/add itself
  // render normally; every other route shows a prompt to get started.
  if (!hasInventory && pathname !== "/inventory/add") {
    return (
      <AppShell>
        <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
          <h1 className="text-xl font-semibold text-slate-900">No inventory yet</h1>
          <p className="max-w-sm text-sm text-slate-500">
            Add your first batch manually, or import an existing spreadsheet to get started.
          </p>
          <Link
            href="/inventory/add"
            className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-teal-700"
          >
            Add Inventory
          </Link>
        </div>
      </AppShell>
    );
  }

  return <AppShell>{children}</AppShell>;
}
