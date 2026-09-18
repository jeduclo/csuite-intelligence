// src/app/layout.tsx — update the metadata export
import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  metadataBase: new URL("https://www.csuiteintelligence.ca"),
  title: {
    default:  "C-Suite Intelligence | Decision Platform",
    template: "%s | C-Suite Intelligence",
  },
  description:
    "Forward-looking executive intelligence built on your ERP data. Predictive cash forecasting, customer default scoring, macro signals — all in one platform.",
  keywords: ["CFO dashboard", "ERP analytics", "cash forecasting", "decision intelligence", "Canada"],
  authors:  [{ name: "C-Suite Intelligence" }],
  openGraph: {
    type:        "website",
    locale:      "en_CA",
    url:         "https://www.csuiteintelligence.ca",
    siteName:    "C-Suite Intelligence",
    title:       "C-Suite Intelligence | Decision Platform",
    description: "Your ERP tells you what happened. We tell you what's coming — and what to do about it.",
    images: [{
      url:    "/og-image.png",
      width:  1200,
      height: 630,
      alt:    "C-Suite Intelligence Platform",
    }],
  },
  twitter: {
    card:        "summary_large_image",
    title:       "C-Suite Intelligence",
    description: "Forward-looking executive intelligence for CFOs, CEOs, and CROs.",
    images:      ["/og-image.png"],
  },
  robots: {
    index:  true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-navy text-signal-muted">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 p-4 lg:p-8 pb-24 lg:pb-8 max-w-7xl">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}