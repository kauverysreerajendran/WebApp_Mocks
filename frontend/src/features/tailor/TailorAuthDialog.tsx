"use client";

import { useRouter } from "next/navigation";
import { strings } from "@/i18n";
import { tailorApi } from "@/lib/api/endpoints";
import { AuthCard, AuthSendLabel } from "@/features/auth/AuthCard";
import { AuthDialog } from "@/features/auth/AuthDialog";
import { OtpLogin } from "@/features/auth/OtpLogin";
import { homeFor } from "./TailorContext";

const p = strings.tailorPortal;
const a = strings.authCard;

/** After OTP sign-in, route the tailor by onboarding status. */
export function useAfterLogin() {
  const router = useRouter();
  return async () => {
    const profile = await tailorApi.me();
    router.replace(homeFor(profile));
  };
}

/** Tailor Login popup; the Register tab hands over to the multi-step registration page. */
export function TailorAuthDialog({ open, onClose, onRegister }: { open: boolean; onClose: () => void; onRegister: () => void }) {
  const afterLogin = useAfterLogin();
  return (
    <AuthDialog open={open} onClose={onClose}>
      {(titleId) => (
        <AuthCard
          titleId={titleId}
          onClose={onClose}
          className="max-h-[calc(100dvh-2rem)]"
          heading={[a.welcome, a.back]}
          lead={a.tailorLead}
          tabs={[
            { key: "register", label: p.loginTabs.register },
            { key: "login", label: p.loginTabs.login },
          ]}
          active="login"
          onTab={(key) => key === "register" && onRegister()}
        >
          <div className="flex flex-col gap-3">
            <p className="text-sm text-muted">{strings.auth.phoneBody}</p>
            <OtpLogin portal="tailor" onSuccess={afterLogin} sendLabel={<AuthSendLabel label={p.sendOtp} />} />
          </div>
        </AuthCard>
      )}
    </AuthDialog>
  );
}
