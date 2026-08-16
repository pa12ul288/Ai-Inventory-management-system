import type { ReactNode } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function AppShell({
  active,
  onLogout,
  children,
}: {
  active?: string;
  onLogout?: () => void;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen w-full bg-white">
      <Sidebar active={active} />
      <div className="flex min-h-screen flex-1 flex-col">
        <Header onLogout={onLogout} />
        <main className="flex flex-1 flex-col bg-white">{children}</main>
      </div>
    </div>
  );
}
