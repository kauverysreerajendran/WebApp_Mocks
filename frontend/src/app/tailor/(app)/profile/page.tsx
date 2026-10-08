import type { Metadata } from "next";
import { ProfileView } from "@/features/tailor/ProfileView";
import { strings } from "@/i18n";

// Session-gated client page (signed-in state lives in the browser), so navigation may block.
export const instant = false;

export const metadata: Metadata = { title: strings.tailor.profileTitle };

export default function Page() {
  return <ProfileView />;
}
