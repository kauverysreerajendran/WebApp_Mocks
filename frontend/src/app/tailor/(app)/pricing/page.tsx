import type { Metadata } from "next";
import { PricingView } from "@/features/tailor/PricingView";
import { strings } from "@/i18n";

// Session-gated client page (signed-in state lives in the browser), so navigation may block.
export const instant = false;

export const metadata: Metadata = { title: strings.nav.tailor.pricing };

export default function Page() {
  return <PricingView />;
}
