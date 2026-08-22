"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { DashboardIcon, InventoryIcon, SellOffIcon, ReorderIcon, ExpiryIcon, ReportsIcon } from "./icons";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: DashboardIcon },
  { label: "Inventory", href: "/inventory", icon: InventoryIcon },
  { label: "Sell Off", href: "/sell-off", icon: SellOffIcon },
  { label: "Reorder", href: "/reorder", icon: ReorderIcon },
  { label: "Expiry Watch", href: "/expiry", icon: ExpiryIcon },
  { label: "Reports", href: "/reports", icon: ReportsIcon },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
      <div className="flex h-16 items-center gap-2 px-6">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-sm font-bold text-white">
          M
        </span>
        <span className="text-base font-semibold text-slate-900">MedStock AI</span>
      </div>
      <nav className="flex-1 px-3 py-4">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
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
      </nav>
      <div className="border-t border-slate-200 px-6 py-4 text-xs text-slate-400">
        AI Inventory Tracker for Medical Distributors
      </div>
    </aside>
  );
}
