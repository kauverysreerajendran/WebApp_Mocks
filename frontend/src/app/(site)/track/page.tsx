import type { Metadata } from "next";
import { Suspense } from "react";
import { ListSkeleton } from "@/components/ui";
import { TrackOrder } from "@/features/track/TrackOrder";
import { strings } from "@/i18n";

export const metadata: Metadata = { title: strings.track.title, description: strings.track.lead };

export default function TrackPage() {
  return (
    <main className="flex flex-1 flex-col bg-background">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-5 px-4 py-8 md:px-8 md:py-10">
        <header className="flex flex-col gap-1">
          <h1 className="text-3xl text-primary">{strings.track.title}</h1>
          <p className="text-sm text-muted">{strings.track.lead}</p>
        </header>
        {/* TrackOrder reads ?order= for prefill, which suspends during prerender. */}
        <Suspense fallback={<ListSkeleton rows={3} />}>
          <TrackOrder />
        </Suspense>
      </div>
    </main>
  );
}
