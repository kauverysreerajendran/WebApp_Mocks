"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { routes } from "@/config/routes";
import { OtpLogin } from "@/features/auth/OtpLogin";

/** Only same-site relative paths are accepted as a return target. */
function safeNext(next: string | null): string {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : routes.account;
}

export function CustomerLogin() {
  const router = useRouter();
  const next = safeNext(useSearchParams().get("next"));
  return <OtpLogin portal="customer" askName onSuccess={() => router.replace(next)} />;
}
