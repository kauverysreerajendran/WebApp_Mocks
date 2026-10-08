import { Suspense } from "react";
import { ListSkeleton } from "@/components/ui";
import { HomeDashboard } from "@/features/home/HomeDashboard";

export default function HomePage() {
  return (
    <Suspense fallback={<ListSkeleton rows={4} className="mx-auto w-full max-w-7xl px-4 py-8 md:px-8" />}>
      <HomeDashboard />
    </Suspense>
  );
}
