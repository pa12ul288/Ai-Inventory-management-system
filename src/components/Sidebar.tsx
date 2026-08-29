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
  CustomersIcon,
  CashFlowIcon,
  ForecastIcon,
  ExpiryIcon,
  ReorderIcon,
  TrendingDownIcon,
  DataSyncIcon,
  CloseIcon,
} from "./icons";

const NAV_GROUPS: { label: string; items: { label: string; href: string; icon: typeof DashboardIcon }[] }[] = [
  {
    label: "Overview",
    items: [
      { label: "Dashboard", href: "/", icon: DashboardIcon },
      { label: "Inventory", href: "/inventory", icon: InventoryIcon },
    ],
  },
  {
    label: "Intelligence",
    items: [
      { label: "AI Recommendations", href: "/ai-recommendations", icon: SparkleIcon },
      { label: "Expiry Risk", href: "/expiry-risk", icon: ExpiryIcon },
      { label: "Reorder Intelligence", href: "/reorder-intelligence", icon: ReorderIcon },
      { label: "Slow-Moving Stock", href: "/slow-moving", icon: TrendingDownIcon },
      { label: "Demand Forecast", href: "/demand-forecast", icon: ForecastIcon },
    ],
  },
  {
    label: "Working Capital",
    items: [
      { label: "Cash Flow", href: "/cash-flow", icon: CashFlowIcon },
      { label: "Customers", href: "/customers", icon: CustomersIcon },
    ],
  },
  {
    label: "Operations",
    items: [
      { label: "Suppliers", href: "/suppliers", icon: SupplierIcon },
      { label: "Warehouse", href: "/warehouse", icon: WarehouseIcon },
      { label: "Data Sync", href: "/data-sync", icon: DataSyncIcon },
      { label: "Reports", href: "/reports", icon: ReportsIcon },
    ],
  },
];

export default function Sidebar({ isOpen = false, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const { handleLogout } = useAppData();

  function isItemActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  const content = (
    <>
      <div className="flex h-16 items-center gap-2.5 px-6">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-teal-700 text-sm font-bold text-white shadow-sm shadow-teal-900/20">
          M
        </span>
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-[15px] font-semibold tracking-tight text-slate-900">MedStock AI</p>
          <p className="truncate text-[11px] font-medium text-slate-400">Inventory Intelligence</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close menu"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 md:hidden"
        >
          <CloseIcon className="h-5 w-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-3">
        {NAV_GROUPS.map((group) => (
          <div key={group.label} className="mb-4">
            <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {group.label}
            </p>
            <ul className="flex flex-col gap-0.5">
              {group.items.map(({ label, href, icon: Icon }) => {
                const isActive = isItemActive(href);
                return (
                  <li key={label}>
                    <Link
                      href={href}
                      onClick={onClose}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                        isActive
                          ? "bg-teal-50 text-teal-700"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <Icon className={`h-[18px] w-[18px] shrink-0 ${isActive ? "text-teal-600" : "text-slate-400"}`} />
                      {label}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-slate-200 px-3 py-3">
        <ul className="flex flex-col gap-0.5">
          <li>
            <Link
              href="/settings"
              onClick={onClose}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                pathname === "/settings" ? "bg-teal-50 text-teal-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              }`}
            >
              <SettingsIcon className={`h-[18px] w-[18px] shrink-0 ${pathname === "/settings" ? "text-teal-600" : "text-slate-400"}`} />
              Settings
            </Link>
          </li>
          <li>
            <button
              type="button"
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-900"
            >
              <LogoutIcon className="h-[18px] w-[18px] shrink-0 text-slate-400" />
              Log Out
            </button>
          </li>
        </ul>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop: static column */}
      <aside className="hidden w-64 shrink-0 flex-col border-r border-slate-200 bg-white md:flex">{content}</aside>

      {/* Mobile: slide-in drawer + overlay */}
      <div
        className={`fixed inset-0 z-40 bg-slate-900/40 transition-opacity duration-200 md:hidden ${
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-slate-200 bg-white shadow-xl transition-transform duration-200 md:hidden ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        aria-hidden={!isOpen}
      >
        {content}
      </aside>
    </>
  );
}
