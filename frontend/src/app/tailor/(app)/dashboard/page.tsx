import type { Metadata } from "next";
import { Dashboard } from "@/features/tailor/Dashboard";
import { strings } from "@/i18n";

// Session-gated client page (signed-in state lives in the browser), so navigation may block.
export const instant = false;

export const metadata: Metadata = { title: strings.tailor.dashboardTitle };

export default function Page() {
  return <Dashboard />;
}
