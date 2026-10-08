import type { Metadata } from "next";
import { AdminOrders } from "@/features/admin/AdminScreens";
import { strings } from "@/i18n";

// Session-gated client page (signed-in state lives in the browser), so navigation may block.
export const instant = false;

export const metadata: Metadata = { title: strings.admin.ordersTitle };

export default function Page() {
  return <AdminOrders />;
}
