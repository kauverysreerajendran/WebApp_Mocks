"use client";

import { Check, CircleX, Clock, RefreshCw } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button, ButtonLink } from "@/components/ui";
import { routes } from "@/config/routes";
import { strings } from "@/i18n";
import { cn } from "@/lib/cn";
import { formatDateTime } from "@/lib/format";
import { ONBOARDING, OnboardingFrame } from "./OnboardingFrame";
import { useTailor } from "./TailorContext";

const t = strings.tailor;

/** Progress-bar index → onboarding ?step= key (only while the application can still be edited). */
const STEP_KEYS: Record<number, string> = {
  [ONBOARDING.register]: "register",
  [ONBOARDING.otp]: "otp",
  [ONBOARDING.details]: "details",
  [ONBOARDING.documents]: "documents",
  [ONBOARDING.bank]: "bank",
  [ONBOARDING.review]: "review",
};

type StageState = "done" | "active" | "failed" | "todo";

/** B5 — Admin Verification → Vendor Approval (or rejection with reason). */
export function VerificationStatus() {
  const { profile, reload } = useTailor();
  const router = useRouter();
  const { status } = profile;

  const stages: StageState[] =
    status === "approved"
      ? ["done", "done", "done"]
      : status === "rejected"
        ? ["done", "failed", "todo"]
        : ["done", "active", "todo"];

  const heading =
    status === "approved"
      ? { icon: Check, tone: "bg-success-soft text-success", title: t.approvedTitle, body: t.approvedBody }
      : status === "rejected"
        ? { icon: CircleX, tone: "bg-error-soft text-error", title: t.rejectedTitle, body: t.rejectedBody }
        : { icon: Clock, tone: "bg-warning-soft text-warning-strong", title: t.pendingTitle, body: t.pendingBody };
  const Icon = heading.icon;

  return (
    <OnboardingFrame
      step={ONBOARDING.submitted}
      onStep={(i) => router.push(`${routes.tailor.onboarding}?step=${STEP_KEYS[i]}`)}
      canStep={(i) => status === "rejected" && Boolean(STEP_KEYS[i])}
    >
      <div className="mx-auto max-w-md">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className={cn("inline-flex size-12 items-center justify-center rounded-full", heading.tone)}>
            <Icon size={24} aria-hidden />
          </span>
          <h1 className="text-xl font-semibold text-primary">{heading.title}</h1>
          <p className="text-sm text-muted">{heading.body}</p>
          {profile.submittedAt && <p className="text-xs text-muted">{t.submittedOn(formatDateTime(profile.submittedAt))}</p>}

          {status === "rejected" && profile.rejectionReason && (
            <div role="alert" className="w-full rounded-control bg-error-soft p-3 text-left text-sm text-error">
              <strong>{t.reason}:</strong> {profile.rejectionReason}
            </div>
          )}

          <ol className="my-3 flex w-full flex-col gap-0 text-left text-sm">
            {t.statusTimeline.map((label, i) => {
              const state = stages[i];
              return (
                <li key={label} className="relative flex items-center gap-3 pb-5 last:pb-0">
                  {i < stages.length - 1 && (
                    <span
                      aria-hidden
                      className={cn(
                        "absolute top-7 bottom-0 left-3.5 w-0.5 -translate-x-1/2",
                        state === "done" ? "bg-success" : "bg-border",
                      )}
                    />
                  )}
                  <span
                    className={cn(
                      "relative inline-flex size-7 shrink-0 items-center justify-center rounded-full border-2",
                      state === "done" && "border-success bg-success text-on-primary",
                      state === "active" && "border-warning bg-warning-soft text-warning-strong",
                      state === "failed" && "border-error bg-error-soft text-error",
                      state === "todo" && "border-border-strong bg-surface text-muted",
                    )}
                  >
                    {state === "done" ? (
                      <Check size={14} strokeWidth={3} aria-hidden />
                    ) : state === "failed" ? (
                      <CircleX size={14} aria-hidden />
                    ) : state === "active" ? (
                      <Clock size={14} aria-hidden />
                    ) : (
                      i + 1
                    )}
                  </span>
                  <span className={cn("font-medium", state === "todo" ? "text-muted" : "text-text")}>{label}</span>
                </li>
              );
            })}
          </ol>

          {status === "approved" && (
            <ButtonLink href={routes.tailor.dashboard} fullWidth>
              {t.goToDashboard}
            </ButtonLink>
          )}
          {status === "rejected" && (
            <ButtonLink href={routes.tailor.onboarding} fullWidth>
              {t.editAndResubmit}
            </ButtonLink>
          )}
          {status === "pending" && (
            <Button variant="secondary" fullWidth leftIcon={<RefreshCw size={16} aria-hidden />} onClick={reload}>
              {t.refresh}
            </Button>
          )}
        </div>
      </div>
    </OnboardingFrame>
  );
}
