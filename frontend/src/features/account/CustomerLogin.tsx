"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { routes } from "@/config/routes";

/** Old /login links: open the login popup on the home page instead, keeping any ?next= target. */
export function CustomerLogin() {
  const router = useRouter();
  const next = useSearchParams().get("next");
  useEffect(() => router.replace(next ? routes.loginNext(next) : routes.login), [router, next]);
  return null;
}
