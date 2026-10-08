import type { Metadata } from "next";
import { TailorGate } from "@/features/tailor/TailorContext";
import { VerificationStatus } from "@/features/tailor/VerificationStatus";
import { strings } from "@/i18n";

// Session-gated client page (signed-in state lives in the browser), so navigation may block.
export const instant = false;

export const metadata: Metadata = { title: strings.tailor.pendingTitle };

export default function TailorStatusPage() {
  return (
    <TailorGate area="status">
      <VerificationStatus />
    </TailorGate>
  );
}
