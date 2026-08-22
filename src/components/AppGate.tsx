"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import AppShell from "./AppShell";
import Login from "./Login";
import UploadScreen from "./UploadScreen";
import { useAppData, supabaseConfigured } from "@/lib/AppDataContext";

export default function AppGate({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { session, loadingInventory, analyzing, error, hasInventory, handleAnalyze, handleLogout } = useAppData();

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
      <AppShell onLogout={handleLogout}>
        <div className="flex flex-1 items-center justify-center text-slate-400">Loading your inventory…</div>
      </AppShell>
    );
  }

  // First-time experience: nothing uploaded yet, no matter which page was
  // requested, get the user into the upload flow.
  if (!hasInventory && pathname !== "/upload") {
    return (
      <AppShell onLogout={handleLogout}>
        <UploadScreen onAnalyze={handleAnalyze} analyzing={analyzing} errorMessage={error} />
      </AppShell>
    );
  }

  return <AppShell onLogout={handleLogout}>{children}</AppShell>;
}
