import type { Metadata } from "next";
import { Suspense } from "react";
import { ListSkeleton } from "@/components/ui";
import { Confirmation } from "@/features/booking/Confirmation";
import { strings } from "@/i18n";

export const metadata: Metadata = { title: strings.confirmation.title };

export default function ConfirmationPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-8 md:px-8 md:py-10">
      <Suspense fallback={<ListSkeleton rows={3} />}>
        <Confirmation />
      </Suspense>
    </main>
  );
}
