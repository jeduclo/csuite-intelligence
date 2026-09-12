// src/app/page.tsx
// Redirects root to the CFO dashboard for Phase 1.
// Will be replaced with the marketing home page in Phase 2.
import { redirect } from "next/navigation";

export default function Home() {
  redirect("/cfo");
}