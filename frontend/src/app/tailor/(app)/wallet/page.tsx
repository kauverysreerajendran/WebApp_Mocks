import type { Metadata } from "next";
import { WalletView } from "@/features/tailor/WalletView";
import { strings } from "@/i18n";

// Session-gated client page (signed-in state lives in the browser), so navigation may block.
export const instant = false;

export const metadata: Metadata = { title: strings.tailor.walletTitle };

export default function Page() {
  return <WalletView />;
}
