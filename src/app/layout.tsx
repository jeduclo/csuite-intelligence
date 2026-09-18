// src/app/layout.tsx — updated to support marketing pages without sidebar
import type { Metadata } from "next";
import "./globals.css";
import { ConditionalLayout } from "@/components/layout/ConditionalLayout";

export const metadata: Metadata = {
  title: {
    default:  "C-Suite Intelligence | Decision Platform",
    template: "%s | C-Suite Intelligence",
  },
  description:
    "Forward-looking executive intelligence built on your ERP data. Predictive cash forecasting, customer default scoring, macro signals — all in one platform.",
  openGraph: {
    type:     "website",
    url:      "https://www.csuiteintelligence.ca",
    siteName: "C-Suite Intelligence",
    images:   [{ url: "/og-image.png", width: 1200, height: 630 }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-navy text-signal-muted">
        <ConditionalLayout>{children}</ConditionalLayout>
      </body>
    </html>
  );
}