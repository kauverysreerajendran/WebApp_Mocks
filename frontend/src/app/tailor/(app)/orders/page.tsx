import type { Metadata } from "next";
import { Suspense } from "react";
import { ListSkeleton } from "@/components/ui";
import { OrdersList } from "@/features/tailor/OrdersList";
import { strings } from "@/i18n";

// Session-gated client page (signed-in state lives in the browser), so navigation may block.
export const instant = false;

export const metadata: Metadata = { title: strings.tailor.ordersTitle };

export default function Page() {
  return (
    <Suspense fallback={<ListSkeleton rows={3} />}>
      <OrdersList />
    </Suspense>
  );
}
