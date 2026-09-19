// src/components/layout/Sidebar.tsx
// Collapsible sidebar for desktop; bottom tab bar on mobile.
// Nav items map directly to dashboard pages.
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

const NAV_ITEMS = [
  { href: "/",               label: "Home",             icon: "🏠" },
  { href: "/cfo",            label: "CFO Overview",     icon: "📊" },
  { href: "/cfo/cash",       label: "Cash Forecast",    icon: "💵" },
  { href: "/cfo/revenue",    label: "Revenue",          icon: "📈" },
  { href: "/cfo/customers",  label: "Customer Risk",    icon: "👥" },
  { href: "/cfo/simulator",  label: "What-If",          icon: "🎛" },
  { href: "/macro",          label: "Macro",            icon: "🌐" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* ── Desktop sidebar (hidden on mobile) ── */}
      <aside className="hidden lg:flex flex-col w-56 min-h-screen bg-navy-card border-r border-navy-border px-3 py-6">
        {/* Logo */}
        <Link href="/" className="px-2 mb-8 block group">
          <p className="text-white font-semibold text-sm leading-tight group-hover:text-signal-blue transition-colors">
            C-Suite Intelligence
          </p>
          <p className="text-signal-muted text-xs mt-0.5">Decision Platform</p>
        </Link>

        {/* Nav links */}
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                pathname === item.href
                  ? "bg-signal-blue/20 text-signal-blue font-medium"
                  : "text-signal-muted hover:text-white hover:bg-navy-border"
              )}
            >
              <span>{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="mt-auto px-2">
          <p className="text-xs text-signal-muted">
            All analytics run in-browser.
            <br />No data leaves your device.
          </p>
        </div>
      </aside>

      {/* ── Mobile bottom tab bar (hidden on desktop) ── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-navy-card border-t border-navy-border flex">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(
              "flex-1 flex flex-col items-center py-3 text-xs gap-1 min-h-[56px]",
              pathname === item.href
                ? "text-signal-blue"
                : "text-signal-muted"
            )}
          >
            <span className="text-lg">{item.icon}</span>
            {/* Hide label on very small screens, show on sm+ */}
            <span className="hidden sm:block leading-none">
              {item.label.split(" ")[0]}
            </span>
          </Link>
        ))}
      </nav>
    </>
  );
}