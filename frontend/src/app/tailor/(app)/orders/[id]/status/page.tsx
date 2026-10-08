import type { Metadata } from "next";
import { Suspense } from "react";
import { ListSkeleton } from "@/components/ui";
import { UpdateOrderStatus } from "@/features/tailor/UpdateOrderStatus";
import { strings } from "@/i18n";

// Session-gated client page (signed-in state lives in the browser), so navigation may block.
export const instant = false;

export const metadata: Metadata = { title: strings.tailorPortal.updateStatus };

export default function Page() {
  return (
    <Suspense fallback={<ListSkeleton rows={3} />}>
      <UpdateOrderStatus />
    </Suspense>
  );
}
