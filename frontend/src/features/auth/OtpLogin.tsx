"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { Button, Input, PhoneInput, type PhoneValue } from "@/components/ui";
import { DEFAULT_COUNTRY, appConfig } from "@/config/app";
import { getCountry } from "@/config/countries";
import { strings } from "@/i18n";
import { errorMessage } from "@/lib/api/client";
import { authApi } from "@/lib/api/endpoints";
import type { TokenResponse } from "@/lib/api/types";
import { sessions } from "@/lib/auth/session";

const RESEND_SECONDS = 30;

interface OtpLoginProps {
  portal: "customer" | "tailor";
  onSuccess: (result: TokenResponse) => void;
  initialPhone?: string;
  /** Name sent with the code, e.g. from a registration form. */
  initialName?: string;
  /** Ask for a name alongside the code (new customers). */
  askName?: boolean;
  submitLabel?: string;
  /** Label for the first ("send code") button; defaults to "Send code". */
  sendLabel?: ReactNode;
}

/** Two-step mobile + OTP sign-in shared by the customer site and the tailor portal. */
export function OtpLogin({ portal, onSuccess, initialPhone = "", initialName = "", askName = false, submitLabel, sendLabel }: OtpLoginProps) {
  const [phone, setPhone] = useState<PhoneValue>({ country: DEFAULT_COUNTRY, number: initialPhone });
  const [step, setStep] = useState<"phone" | "code">("phone");
  const [code, setCode] = useState("");
  const [name, setName] = useState(initialName);
  const [devCode, setDevCode] = useState<string | null>(null);
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => window.clearTimeout(t);
  }, [cooldown]);

  const phoneValid = getCountry(phone.country).phonePattern.test(phone.number);

  const sendCode = async () => {
    if (!phoneValid) {
      setError(strings.validation.phone);
      return;
    }
    setPending(true);
    setError(undefined);
    try {
      const res = await authApi.requestOtp(portal, phone.number, phone.country);
      if (appConfig.otpAutoLogin && res.devCode) {
        await signIn(res.devCode);
        return;
      }
      setDevCode(res.devCode);
      setStep("code");
      setCode("");
      setCooldown(RESEND_SECONDS);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  };

  /** Exchanges a code for a session. Throws on failure; callers own the pending/error state. */
  const signIn = async (otp: string) => {
    const res = await authApi.verifyOtp(portal, phone.number, phone.country, otp, name.trim() || undefined);
    sessions[portal].set({ token: res.accessToken, user: res.user });
    onSuccess(res);
  };

  const verify = async () => {
    if (!/^\d{6}$/.test(code)) {
      setError(strings.validation.otp);
      return;
    }
    setPending(true);
    setError(undefined);
    try {
      await signIn(code);
    } catch (err) {
      setError(errorMessage(err));
      setPending(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (step === "phone") void sendCode();
    else void verify();
  };

  const dial = getCountry(phone.country).dialCode;

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {step === "phone" ? (
        <>
          <PhoneInput
            value={phone}
            onChange={(v) => {
              setPhone(v);
              setError(undefined);
            }}
            error={error}
          />
          <Button type="submit" fullWidth loading={pending}>
            {sendLabel ?? strings.auth.sendCode}
          </Button>
        </>
      ) : (
        <>
          <p className="text-sm text-muted">
            {strings.auth.codeBody(`${dial} ${phone.number}`)}{" "}
            <button
              type="button"
              className="rounded-control font-medium text-accent underline-offset-4 hover:underline focus-ring"
              onClick={() => {
                setStep("phone");
                setError(undefined);
              }}
            >
              {strings.auth.changeNumber}
            </button>
          </p>
          {devCode && (
            <p className="rounded-control bg-warning-soft px-3 py-2 text-sm text-warning-strong" role="note">
              {strings.auth.devCode(devCode)}
            </p>
          )}
          {askName && (
            <Input
              label={strings.auth.nameOptional}
              optional
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          )}
          <Input
            label={strings.auth.code}
            value={code}
            onChange={(e) => {
              setCode(e.target.value.replace(/\D/g, "").slice(0, 6));
              setError(undefined);
            }}
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            maxLength={6}
            error={error}
            className="tracking-[0.4em]"
          />
          <Button type="submit" fullWidth loading={pending}>
            {submitLabel ?? strings.auth.verify}
          </Button>
          <Button variant="text" size="sm" className="self-center text-sm" disabled={cooldown > 0 || pending} onClick={() => void sendCode()}>
            {cooldown > 0 ? strings.auth.resendIn(cooldown) : strings.auth.resend}
          </Button>
        </>
      )}
    </form>
  );
}
