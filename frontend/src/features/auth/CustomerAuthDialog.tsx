"use client";

import { ArrowRight } from "lucide-react";
import { useState, type FormEvent } from "react";
import { Button, Checkbox, Input, Modal, PhoneInput, Textarea, useToast, type PhoneValue } from "@/components/ui";
import { DEFAULT_COUNTRY, appConfig } from "@/config/app";
import { getCountry } from "@/config/countries";
import { strings } from "@/i18n";
import { errorMessage } from "@/lib/api/client";
import { authApi } from "@/lib/api/endpoints";
import { sessions } from "@/lib/auth/session";
import { cn } from "@/lib/cn";
import { compact, isEmail, isPostal } from "@/lib/validation";
import { OtpLogin } from "./OtpLogin";

const c = strings.customerAuth;
export type CustomerAuthMode = "signup" | "login";

interface SignUpForm {
  name: string;
  phone: PhoneValue;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  agree: boolean;
}
type Errors = Partial<Record<keyof SignUpForm, string>>;

const EMPTY: SignUpForm = {
  name: "",
  phone: { country: DEFAULT_COUNTRY, number: "" },
  email: "",
  address: "",
  city: "",
  postalCode: "",
  agree: false,
};

/** Sign Up: basic and address details in one form, verified by OTP, saved to the customer profile. */
function SignUpPanel({ onDone, onLogin }: { onDone: () => void; onLogin: () => void }) {
  const toast = useToast();
  const [f, setF] = useState<SignUpForm>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  // Without dev auto-login the code is typed in a second step.
  const [verifying, setVerifying] = useState(false);
  const set = <K extends keyof SignUpForm>(k: K, v: SignUpForm[K]) => {
    setF((s) => ({ ...s, [k]: v }));
    setErrors((e) => ({ ...e, [k]: undefined }));
  };

  const saveProfile = async () => {
    const user = await authApi.updateProfile({
      name: f.name.trim(),
      email: f.email.trim() || null,
      address: f.address.trim() || null,
      city: f.city.trim() || null,
      postalCode: f.postalCode.trim() || null,
    });
    // Refresh the stored user so the header and booking forms pick up the new details.
    const session = sessions.customer.get();
    if (session) sessions.customer.set({ ...session, user });
    toast.success(c.welcome(f.name.trim()));
    onDone();
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const country = getCountry(f.phone.country);
    const errs = compact({
      name: f.name.trim().length < 2 ? strings.validation.required(strings.fields.name) : undefined,
      phone: !country.phonePattern.test(f.phone.number) ? strings.validation.phone : undefined,
      email: f.email.trim() && !isEmail(f.email.trim()) ? strings.validation.email : undefined,
      postalCode: f.postalCode.trim() && !isPostal(f.postalCode, f.phone.country) ? strings.validation.postal(strings.fields[country.postalLabelKey]) : undefined,
      agree: f.agree ? undefined : c.agreeRequired,
    }) as Errors;
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      const otp = await authApi.requestOtp("customer", f.phone.number, f.phone.country);
      if (appConfig.otpAutoLogin && otp.devCode) {
        const res = await authApi.verifyOtp("customer", f.phone.number, f.phone.country, otp.devCode, f.name.trim());
        sessions.customer.set({ token: res.accessToken, user: res.user });
        await saveProfile();
      } else {
        setVerifying(true);
      }
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (verifying)
    return (
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted">{c.verifyLead}</p>
        <OtpLogin
          portal="customer"
          initialPhone={f.phone.number}
          initialName={f.name.trim()}
          submitLabel={c.createAccount}
          onSuccess={() => saveProfile().catch((err) => toast.error(errorMessage(err)))}
        />
        <Button variant="text" size="sm" className="self-start" onClick={() => setVerifying(false)}>
          {strings.common.back}
        </Button>
      </div>
    );

  const postalLabel = strings.fields[getCountry(f.phone.country).postalLabelKey];
  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <fieldset className="grid gap-3 sm:grid-cols-2">
        <legend className="mb-2 text-xs font-semibold tracking-[0.12em] text-accent uppercase">{c.basicDetails}</legend>
        <Input label={strings.fields.name} value={f.name} onChange={(e) => set("name", e.target.value)} error={errors.name} autoComplete="name" />
        <PhoneInput value={f.phone} onChange={(v) => set("phone", v)} error={errors.phone} />
        <Input
          label={strings.fields.email}
          optional
          type="email"
          value={f.email}
          onChange={(e) => set("email", e.target.value)}
          error={errors.email}
          autoComplete="email"
          containerClassName="sm:col-span-2"
        />
      </fieldset>
      <fieldset className="grid gap-3 sm:grid-cols-2">
        <legend className="mb-2 text-xs font-semibold tracking-[0.12em] text-accent uppercase">{c.addressDetails}</legend>
        <Textarea
          label={strings.fields.address}
          optional
          rows={2}
          placeholder={strings.fields.addressHint}
          value={f.address}
          onChange={(e) => set("address", e.target.value)}
          autoComplete="street-address"
          containerClassName="sm:col-span-2"
        />
        <Input label={strings.fields.city} optional value={f.city} onChange={(e) => set("city", e.target.value)} autoComplete="address-level2" />
        <Input
          label={postalLabel}
          optional
          inputMode="numeric"
          value={f.postalCode}
          onChange={(e) => set("postalCode", e.target.value)}
          error={errors.postalCode}
          autoComplete="postal-code"
        />
      </fieldset>
      <div>
        <Checkbox label={c.agree} checked={f.agree} onChange={(e) => set("agree", e.target.checked)} />
        {errors.agree && (
          <p role="alert" className="text-xs text-error">
            {errors.agree}
          </p>
        )}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <p className="text-sm text-muted">
          {c.haveAccount}{" "}
          <button type="button" onClick={onLogin} className="rounded-control font-medium text-accent hover:underline focus-ring">
            {c.loginTab}
          </button>
        </p>
        <div className="flex gap-2">
          <Button type="button" variant="secondary" onClick={() => (setF(EMPTY), setErrors({}))}>
            {strings.common.cancel}
          </Button>
          <Button type="submit" loading={saving} rightIcon={<ArrowRight size={16} aria-hidden />}>
            {c.createAccount}
          </Button>
        </div>
      </div>
    </form>
  );
}

/** Customer Sign Up / Login popup opened from the site header — no page change. */
export function CustomerAuthDialog({
  mode,
  onModeChange,
  onClose,
}: {
  mode: CustomerAuthMode | null;
  onModeChange: (m: CustomerAuthMode) => void;
  onClose: () => void;
}) {
  return (
    <Modal open={mode !== null} onClose={onClose} title={mode === "login" ? c.loginTitle : c.signUpTitle} size="lg">
      <div role="tablist" aria-label={c.signUpTitle} className="mb-5 grid grid-cols-2 border-b border-border">
        {(["signup", "login"] as const).map((m) => (
          <button
            key={m}
            role="tab"
            type="button"
            aria-selected={mode === m}
            onClick={() => onModeChange(m)}
            className={cn(
              "-mb-px border-b-2 pb-2.5 text-sm focus-ring",
              mode === m ? "border-accent font-medium text-accent" : "border-transparent text-muted hover:text-text",
            )}
          >
            {m === "signup" ? c.signUpTab : c.loginTab}
          </button>
        ))}
      </div>
      {mode === "signup" && <SignUpPanel onDone={onClose} onLogin={() => onModeChange("login")} />}
      {mode === "login" && (
        <div className="mx-auto flex max-w-sm flex-col gap-3">
          <p className="text-sm text-muted">{strings.auth.phoneBody}</p>
          <OtpLogin portal="customer" askName onSuccess={onClose} />
        </div>
      )}
    </Modal>
  );
}
