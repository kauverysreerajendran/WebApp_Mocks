import type { Metadata } from "next";
import { UpdateStatus } from "@/features/admin/AdminScreens";
import { strings } from "@/i18n";

// Session-gated client page (signed-in state lives in the browser), so navigation may block.
export const instant = false;

export const metadata: Metadata = { title: strings.admin.updateStatusTitle };

export default function Page() {
  return <UpdateStatus />;
}
