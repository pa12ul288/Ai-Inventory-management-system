"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAppData } from "@/lib/AppDataContext";
import {
  DashboardIcon,
  InventoryIcon,
  SupplierIcon,
  WarehouseIcon,
  SparkleIcon,
  ReportsIcon,
  SettingsIcon,
  LogoutIcon,
} from "./icons";

const NAV_ITEMS = [
  { label: "Dashboard", href: "/", icon: DashboardIcon },
  { label: "Inventory", href: "/inventory", icon: InventoryIcon },
  { label: "AI Recommendations", href: "/ai-recommendations", icon: SparkleIcon },
  { label: "Suppliers", href: "/suppliers", icon: SupplierIcon },
  { label: "Warehouse", href: "/warehouse", icon: WarehouseIcon },
  { label: "Reports", href: "/reports", icon: ReportsIcon },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { handleLogout } = useAppData();

  return (
    <aside className="hidden w-56 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">
      <div className="flex h-16 items-center gap-2 px-6">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-600 text-sm font-bold text-white">
          M
        </span>
        <span className="text-base font-semibold text-slate-900">MedStock AI</span>
      </div>

      <nav className="flex-1 px-3 py-4">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ label, href, icon: Icon }) => {
            const isActive = pathname === href || (href === "/inventory" && pathname.startsWith("/inventory"));
            return (
              <li key={label}>
                <Link
                  href={href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive ? "text-teal-600" : "text-slate-600 hover:text-slate-900"
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

      <div className="border-t border-slate-200 px-3 py-4">
        <ul className="flex flex-col gap-1">
          <li>
            <Link
              href="/settings"
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                pathname === "/settings" ? "text-teal-600" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <SettingsIcon className="h-5 w-5 shrink-0" />
              Settings
            </Link>
          </li>
          <li>
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-slate-600 transition-colors hover:text-slate-900"
            >
              <LogoutIcon className="h-5 w-5 shrink-0" />
              Log Out
            </button>
          </li>
        </ul>
      </div>
    </aside>
  );
}
