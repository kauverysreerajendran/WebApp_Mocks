import type { Metadata } from "next";
import { Suspense } from "react";
import { ListSkeleton } from "@/components/ui";
import { CompletedOrders } from "@/features/tailor/CompletedOrders";
import { strings } from "@/i18n";

// Session-gated client page (signed-in state lives in the browser), so navigation may block.
export const instant = false;

export const metadata: Metadata = { title: strings.tailor.completedTitle };

export default function Page() {
  return (
    <Suspense fallback={<ListSkeleton rows={3} />}>
      <CompletedOrders />
    </Suspense>
  );
}
