import type { Metadata } from "next";
import { Suspense } from "react";
import { ListSkeleton } from "@/components/ui";
import { CustomerOrderDetail } from "@/features/account/CustomerOrderDetail";
import { strings } from "@/i18n";

export const metadata: Metadata = { title: strings.common.order };

export default function CustomerOrderPage() {
  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-7 md:px-8">
      <Suspense fallback={<ListSkeleton rows={4} />}>
        <CustomerOrderDetail />
      </Suspense>
    </main>
  );
}
