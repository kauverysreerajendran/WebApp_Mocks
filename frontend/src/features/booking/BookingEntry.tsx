"use client";

import dynamic from "next/dynamic";
import { useSearchParams } from "next/navigation";
import { ListSkeleton } from "@/components/ui";

// Booking state lives in sessionStorage, so the flow renders on the client only (no hydration mismatch).
const BookingFlow = dynamic(() => import("./BookingFlow").then((m) => m.BookingFlow), {
  ssr: false,
  loading: () => <ListSkeleton rows={4} className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8" />,
});

export function BookingEntry() {
  const preselect = useSearchParams().get("service");
  return <BookingFlow preselect={preselect} />;
}
