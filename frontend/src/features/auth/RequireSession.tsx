"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { ListSkeleton } from "@/components/ui";
import type { Role } from "@/lib/api/types";
import { useSession, type Session } from "@/lib/auth/session";

interface RequireSessionProps {
  role: Role;
  /** Where to send signed-out visitors; receives the current path for a return link. */
  loginHref: (returnTo: string) => string;
  fallback?: ReactNode;
  children: (session: Session) => ReactNode;
}

/** Client-side guard: waits for hydration, redirects signed-out users, renders children with the session. */
export function RequireSession({ role, loginHref, fallback, children }: RequireSessionProps) {
  const session = useSession(role);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (session === null) router.replace(loginHref(pathname));
  }, [session, router, loginHref, pathname]);

  if (!session) return <>{fallback ?? <ListSkeleton rows={3} className="mx-auto w-full max-w-5xl px-4 py-10" />}</>;
  return <>{children(session)}</>;
}
