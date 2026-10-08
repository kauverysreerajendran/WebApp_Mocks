import { Smartphone } from "lucide-react";
import type { Metadata } from "next";
import { Suspense } from "react";
import { Card, Skeleton } from "@/components/ui";
import { CustomerLogin } from "@/features/account/CustomerLogin";
import { strings } from "@/i18n";

export const metadata: Metadata = { title: strings.nav.customer.login };

export default function LoginPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-10">
      <Card padding="lg">
        <span className="mb-3 inline-flex size-9 items-center justify-center rounded-control bg-accent-soft text-accent">
          <Smartphone size={18} aria-hidden />
        </span>
        <h1 className="mb-1 text-xl">{strings.auth.phoneTitle}</h1>
        <p className="mb-5 text-sm text-muted">{strings.auth.phoneBody}</p>
        <Suspense fallback={<Skeleton className="h-32 w-full" />}>
          <CustomerLogin />
        </Suspense>
      </Card>
    </main>
  );
}
