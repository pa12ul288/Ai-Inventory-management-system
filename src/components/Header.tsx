"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppData } from "@/lib/AppDataContext";
import { SearchIcon, BellIcon, AvatarIcon, MenuIcon } from "./icons";

function initialsFromEmail(email: string | undefined) {
  if (!email) return null;
  return email.slice(0, 2).toUpperCase();
}

export default function Header({ onMenuClick }: { onMenuClick?: () => void }) {
  const router = useRouter();
  const { session } = useAppData();
  const [query, setQuery] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const initials = initialsFromEmail(session?.user?.email);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/inventory?search=${encodeURIComponent(trimmed)}` : "/inventory");
    setMobileSearchOpen(false);
  }

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-slate-200 bg-white/80 px-3 backdrop-blur-sm sm:gap-4 sm:px-6">
      <button
        type="button"
        onClick={onMenuClick}
        aria-label="Open menu"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 md:hidden"
      >
        <MenuIcon className="h-5 w-5" />
      </button>

      <form
        onSubmit={handleSubmit}
        className={`${mobileSearchOpen ? "flex" : "hidden"} mx-auto w-full max-w-xl sm:flex`}
      >
        <div className="relative w-full">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search product, supplier, order"
            autoFocus={mobileSearchOpen}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2 pl-10 pr-3 text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:border-teal-500 focus:bg-white focus:ring-1 focus:ring-teal-500"
          />
        </div>
      </form>

      {!mobileSearchOpen && (
        <button
          type="button"
          onClick={() => setMobileSearchOpen(true)}
          aria-label="Search"
          className="ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-slate-700 sm:hidden"
        >
          <SearchIcon className="h-5 w-5" />
        </button>
      )}

      <div className={`${mobileSearchOpen ? "hidden sm:flex" : "flex"} shrink-0 items-center gap-2 sm:gap-3`}>
        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <BellIcon className="h-5 w-5" />
          <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-teal-600" />
        </button>
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-600 text-xs font-bold text-white">
          {initials ?? <AvatarIcon className="h-5 w-5" />}
        </span>
      </div>
    </header>
  );
}
