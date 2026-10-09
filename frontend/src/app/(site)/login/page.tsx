import type { Metadata } from "next";
import { Suspense } from "react";
import { CustomerLogin } from "@/features/account/CustomerLogin";
import { strings } from "@/i18n";

export const metadata: Metadata = { title: strings.nav.customer.login };

/** Login opens as a popup over the site; this page only hosts it for direct visits and redirects. */
export default function LoginPage() {
  return (
    <main className="flex-1 bg-blush-wash">
      <Suspense>
        <CustomerLogin />
      </Suspense>
    </main>
  );
}
