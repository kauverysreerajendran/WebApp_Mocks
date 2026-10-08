import type { Metadata } from "next";
import { Suspense } from "react";
import { ListSkeleton } from "@/components/ui";
import { TailorOrderDetail } from "@/features/tailor/TailorOrderDetail";
import { strings } from "@/i18n";

// Session-gated client page (signed-in state lives in the browser), so navigation may block.
export const instant = false;

export const metadata: Metadata = { title: strings.tailor.orderDetailsTitle };

export default function Page() {
  return (
    <Suspense fallback={<ListSkeleton rows={3} />}>
      <TailorOrderDetail />
    </Suspense>
  );
}
