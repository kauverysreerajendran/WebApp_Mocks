import type { Metadata } from "next";
import { Onboarding } from "@/features/tailor/Onboarding";
import { TailorGate } from "@/features/tailor/TailorContext";
import { strings } from "@/i18n";

// Session-gated client page (signed-in state lives in the browser), so navigation may block.
export const instant = false;

export const metadata: Metadata = { title: strings.tailor.onboardingTitle };

export default function TailorOnboardingPage() {
  return (
    <TailorGate area="onboarding">
      <Onboarding />
    </TailorGate>
  );
}
