import type { Metadata } from "next";
import { AvailabilityView } from "@/features/tailor/AvailabilityView";
import { strings } from "@/i18n";

// Session-gated client page (signed-in state lives in the browser), so navigation may block.
export const instant = false;

export const metadata: Metadata = { title: strings.tailorPortal.calendar.title };

export default function Page() {
  return <AvailabilityView />;
}
