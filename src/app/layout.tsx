// src/app/layout.tsx
// Root layout — wraps all pages with Sidebar + top padding for mobile nav.
import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "C-Suite Intelligence | Decision Platform",
  description:
    "Forward-looking executive intelligence. Predictive, prescriptive, macro-aware.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-navy text-signal-muted">
        <div className="flex min-h-screen">
          {/* Sidebar (desktop only) */}
          <Sidebar />

          {/* Main content area */}
          <main className="flex-1 p-4 lg:p-8 pb-24 lg:pb-8 max-w-7xl">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}