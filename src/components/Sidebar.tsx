"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppData } from "@/lib/AppDataContext";
import {
  DashboardIcon,
  InventoryIcon,
  SellOffIcon,
  ReorderIcon,
  ExpiryIcon,
  ReportsIcon,
  LogoutIcon,
} from "./icons";

const NAV_GROUPS = [
  {
    label: "Overview",
    items: [{ label: "Dashboard", href: "/", icon: DashboardIcon }],
  },
  {
    label: "Inventory",
    items: [
      { label: "All Inventory", href: "/inventory", icon: InventoryIcon },
      { label: "Sell Off", href: "/sell-off", icon: SellOffIcon },
      { label: "Reorder", href: "/reorder", icon: ReorderIcon },
      { label: "Expiry Watch", href: "/expiry", icon: ExpiryIcon },
    ],
  },
  {
    label: "Reports",
    items: [{ label: "Reports", href: "/reports", icon: ReportsIcon }],
  },
];

function initialsFromEmail(email: string | undefined) {
  if (!email) return "?";
  return email.slice(0, 2).toUpperCase();
}

export default function Sidebar() {
  const pathname = usePathname();
  const { session, handleLogout } = useAppData();
  const email = session?.user?.email;

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
      <div className="flex h-16 items-center gap-2 px-6">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-sm font-bold text-white">
          M
        </span>
        <span className="text-base font-semibold text-slate-900">MedStock AI</span>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-5 last:mb-0">
            <p className="mb-1.5 px-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {group.label}
            </p>
            <ul className="flex flex-col gap-1">
              {group.items.map(({ label, href, icon: Icon }) => {
                const isActive = pathname === href;
                return (
                  <li key={label}>
                    <Link
                      href={href}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-teal-50 text-teal-700"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <Icon className="h-5 w-5 shrink-0" />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {email && (
        <div className="border-t border-slate-200 p-3">
          <div className="flex items-center gap-3 rounded-xl bg-slate-50 p-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white">
              {initialsFromEmail(email)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-800">{email}</p>
              <p className="text-xs text-slate-400">Distributor account</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Log out"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-200 hover:text-slate-700"
            >
              <LogoutIcon className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
