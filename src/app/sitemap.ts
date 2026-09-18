// src/app/sitemap.ts
import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://www.csuiteintelligence.ca";
  return [
    { url: base,                    lastModified: new Date(), changeFrequency: "weekly",  priority: 1.0 },
    { url: `${base}/about`,         lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/cfo`,           lastModified: new Date(), changeFrequency: "weekly",  priority: 0.9 },
    { url: `${base}/cfo/cash`,      lastModified: new Date(), changeFrequency: "weekly",  priority: 0.8 },
    { url: `${base}/cfo/revenue`,   lastModified: new Date(), changeFrequency: "weekly",  priority: 0.8 },
    { url: `${base}/cfo/customers`, lastModified: new Date(), changeFrequency: "weekly",  priority: 0.8 },
    { url: `${base}/cfo/simulator`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: `${base}/macro`,         lastModified: new Date(), changeFrequency: "weekly",  priority: 0.9 },
  ];
}