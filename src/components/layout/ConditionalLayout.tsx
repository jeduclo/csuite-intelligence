// src/components/layout/ConditionalLayout.tsx
// Shows sidebar on /cfo/* and /macro pages.
// Shows plain layout on / and /about (marketing pages).
"use client";

import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboard = pathname.startsWith("/cfo") || pathname.startsWith("/macro");

  if (isDashboard) {
    return (
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 p-4 lg:p-8 pb-24 lg:pb-8 max-w-7xl">
          {children}
        </main>
      </div>
    );
  }

  // Marketing pages — full width, no sidebar
  return <>{children}</>;
}