"use client";

import { usePathname, useRouter } from "next/navigation";
import { createContext, useContext, useEffect, type ReactNode } from "react";
import { ErrorState, ListSkeleton } from "@/components/ui";
import { routes } from "@/config/routes";
import { strings } from "@/i18n";
import { tailorApi } from "@/lib/api/endpoints";
import type { TailorProfile } from "@/lib/api/types";
import { useSession } from "@/lib/auth/session";
import { useApi } from "@/lib/hooks/useApi";

interface TailorContextValue {
  profile: TailorProfile;
  setProfile: (p: TailorProfile) => void;
  reload: () => void;
}

const Ctx = createContext<TailorContextValue | null>(null);

export function useTailor(): TailorContextValue {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTailor must be used inside <TailorGate>");
  return ctx;
}

/** Where a tailor belongs given their onboarding status. */
/** Shop name, or the owner / phone when registration details were skipped. */
export function displayName(profile: Pick<TailorProfile, "shopName" | "ownerName" | "phone">): string {
  return profile.shopName.trim() || profile.ownerName.trim() || profile.phone || strings.tailorPortal.partnerPortal;
}

export function homeFor(profile: TailorProfile): string {
  switch (profile.status) {
    // Submitted profiles go straight to the dashboard; admin verification happens in the background.
    case "approved":
    case "pending":
    case "rejected":
      return routes.tailor.dashboard;
    default:
      return routes.tailor.onboarding;
  }
}

type Area = "onboarding" | "status" | "app";

function allowed(area: Area, profile: TailorProfile): boolean {
  if (area === "app") return profile.status !== "draft";
  if (area === "status") return profile.status === "pending" || profile.status === "rejected" || profile.status === "approved";
  return profile.status === "draft" || profile.status === "rejected";
}

const Loading = () => <ListSkeleton rows={3} className="mx-auto w-full max-w-3xl px-4 py-8" />;

/**
 * Guards a tailor area: requires a session, loads the profile, and routes the tailor to the
 * screen that matches their onboarding status (draft → wizard, submitted → app).
 */
export function TailorGate({ area, children }: { area: Area; children: ReactNode }) {
  const session = useSession("tailor");
  const router = useRouter();
  const pathname = usePathname();
  const { data, status, reload, setData } = useApi(session ? `tailor-me:${session.user.id}` : null, tailorApi.me);

  useEffect(() => {
    if (session === null) router.replace(routes.tailor.login);
  }, [session, router]);

  useEffect(() => {
    if (data && !allowed(area, data)) {
      const target = homeFor(data);
      if (target !== pathname) router.replace(target);
    }
  }, [data, area, router, pathname]);

  if (!session) return <Loading />;
  if (status === "error") return <ErrorState onRetry={reload} className="m-4" />;
  if (!data || !allowed(area, data)) return <Loading />;

  return <Ctx.Provider value={{ profile: data, setProfile: setData, reload }}>{children}</Ctx.Provider>;
}
