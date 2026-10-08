import type { Metadata } from "next";
import { Executives } from "@/features/admin/AdminManagement";
import { strings } from "@/i18n";

// Session-gated client page (signed-in state lives in the browser), so navigation may block.
export const instant = false;

export const metadata: Metadata = { title: strings.admin.executivesTitle };

export default function Page() {
  return <Executives />;
}
