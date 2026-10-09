"use client";

import { LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { Logo } from "@/components/nav/Logo";
import { Button, Stepper } from "@/components/ui";
import { routes } from "@/config/routes";
import { strings } from "@/i18n";
import { sessions } from "@/lib/auth/session";
import { cn } from "@/lib/cn";

const p = strings.tailorPortal;

/** Index into the 7-step registration journey (Register … Submitted). */
export const ONBOARDING = { register: 0, otp: 1, details: 2, documents: 3, bank: 4, review: 5, submitted: 6 } as const;

/**
 * Page frame for tailor registration (reference: New Vendor Registration / Document Upload):
 * slim header, then one card holding the 7-step progress and the current step.
 */
export function OnboardingFrame({
  step,
  title,
  lead,
  children,
  signedIn = true,
  wide = false,
  onStep,
  canStep,
}: {
  step: number;
  title?: string;
  lead?: string;
  children: ReactNode;
  /** Show Logout (hidden on the Register / OTP steps, before sign-in). */
  signedIn?: boolean;
  wide?: boolean;
  /** Click a step on the progress bar to open that step's form. */
  onStep?: (index: number) => void;
  canStep?: (index: number) => boolean;
}) {
  const router = useRouter();
  return (
    <>
      <header className="border-b border-border bg-surface">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Logo href={routes.home} tagline={p.portalName} />
          {signedIn && (
            <Button
              variant="text"
              leftIcon={<LogOut size={16} aria-hidden />}
              onClick={() => {
                sessions.tailor.set(null);
                router.replace(routes.tailor.login);
              }}
            >
              {strings.common.logout}
            </Button>
          )}
        </div>
      </header>
      <main id="main" className={cn("mx-auto w-full flex-1 px-4 py-6", wide ? "max-w-5xl" : "max-w-4xl")}>
        <div className="rounded-card border border-border bg-surface shadow-card">
          <div className="border-b border-border px-4 py-4 md:px-6">
            <Stepper steps={p.onboardingSteps} current={step} onSelect={onStep} canSelect={canStep} />
          </div>
          <div className="p-4 md:p-6">
            {title && <h1 className="text-xl">{title}</h1>}
            {lead && <p className="mb-4 text-sm text-muted">{lead}</p>}
            {children}
          </div>
        </div>
      </main>
    </>
  );
}
