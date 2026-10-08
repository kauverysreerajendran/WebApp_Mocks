import type { Metadata } from "next";
import { AccountDashboard } from "@/features/account/AccountDashboard";
import { strings } from "@/i18n";

export const metadata: Metadata = { title: strings.account.title };

export default function AccountPage() {
  return <AccountDashboard />;
}
