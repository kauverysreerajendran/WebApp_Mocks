import { Suspense } from "react";
import { ListSkeleton } from "@/components/ui";
import { TailorGate } from "@/features/tailor/TailorContext";
import { TailorShell } from "@/features/tailor/TailorShell";

// Session-gated client shell: content depends on the signed-in user, so navigations here may block.
export const instant = false;

export default function TailorAppLayout({ children }: LayoutProps<"/tailor">) {
  return (
    // TailorGate reads the pathname, which suspends on dynamic routes (orders/[id]) during prerender.
    <Suspense fallback={<ListSkeleton rows={3} className="mx-auto w-full max-w-3xl px-4 py-8" />}>
      <TailorGate area="app">
        <TailorShell>{children}</TailorShell>
      </TailorGate>
    </Suspense>
  );
}
