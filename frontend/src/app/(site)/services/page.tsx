import type { Metadata } from "next";
import { Suspense } from "react";
import { ListSkeleton } from "@/components/ui";
import { BookingEntry } from "@/features/booking/BookingEntry";
import { strings } from "@/i18n";

export const metadata: Metadata = { title: strings.servicesPage.title };

/** Services runs the same step-by-step booking form as /book (Service → Package → Design → Measurements → Details → Summary). */
export default function ServicesPage() {
  return (
    <main className="flex-1">
      <Suspense fallback={<ListSkeleton rows={4} className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8" />}>
        <BookingEntry />
      </Suspense>
    </main>
  );
}
