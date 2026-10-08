"use client";

import { ArrowRight, CalendarDays, CircleCheck, FileText, Landmark, UserPlus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Logo } from "@/components/nav/Logo";
import { Button, Checkbox, Input, LeafOrnament, ListSkeleton, Photo, PhoneInput, type PhoneValue } from "@/components/ui";
import { DEFAULT_COUNTRY } from "@/config/app";
import { getCountry } from "@/config/countries";
import { media } from "@/config/media";
import { routes } from "@/config/routes";
import { strings } from "@/i18n";
import { tailorApi } from "@/lib/api/endpoints";
import { useSession } from "@/lib/auth/session";
import { isEmail } from "@/lib/validation";
import { OtpLogin } from "@/features/auth/OtpLogin";
import { ONBOARDING, OnboardingFrame } from "./OnboardingFrame";
import { homeFor } from "./TailorContext";

const p = strings.tailorPortal;
const REG_KEY = "tt.tailor.register";
const HERO_ICONS = [FileText, CalendarDays, Landmark];

interface Registration {
  name: string;
  email: string;
  phone: PhoneValue;
}

/** Register-form details carried into Basic Details after OTP sign-in. */
export function readRegistration(): Registration | null {
  try {
    const raw = typeof window === "undefined" ? null : sessionStorage.getItem(REG_KEY);
    return raw ? (JSON.parse(raw) as Registration) : null;
  } catch {
    return null;
  }
}

function saveRegistration(r: Registration) {
  try {
    sessionStorage.setItem(REG_KEY, JSON.stringify(r));
  } catch {
    // Prefill is a convenience; ignore storage failures.
  }
}

function useAfterLogin() {
  const router = useRouter();
  return async () => {
    const profile = await tailorApi.me();
    router.replace(homeFor(profile));
  };
}

/** Right-hand panel of the Register screen. */
function Promo() {
  return (
    <aside className="relative hidden overflow-hidden rounded-card bg-blush-wash md:block">
      <Photo image={media.contactSide} className="absolute inset-0 bg-transparent" sizes="320px" unoptimized />
      <div className="absolute inset-0 bg-linear-to-r from-blush via-blush/90 to-transparent" />
      <div className="relative flex h-full flex-col justify-center gap-3 p-5">
        <p className="max-w-48 text-lg leading-snug font-medium text-primary">{p.promoTitle}</p>
        <ul className="flex flex-col gap-1.5">
          {p.promoPoints.map((point) => (
            <li key={point} className="flex items-center gap-2 text-sm text-text">
              <CircleCheck size={15} aria-hidden className="text-accent" />
              {point}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}

/** Step 1 of 7 — Create Your Account (reference: New Vendor Registration). */
function RegisterStep({ onNext, onLogin }: { onNext: (r: Registration) => void; onLogin: () => void }) {
  const saved = readRegistration();
  const [name, setName] = useState(saved?.name ?? "");
  const [phone, setPhone] = useState<PhoneValue>(saved?.phone ?? { country: DEFAULT_COUNTRY, number: "" });
  const [email, setEmail] = useState(saved?.email ?? "");
  const [agree, setAgree] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; phone?: string; email?: string; agree?: string }>({});

  /** Cancel: empty every field and forget the saved draft. */
  const clearForm = () => {
    setName("");
    setPhone({ country: DEFAULT_COUNTRY, number: "" });
    setEmail("");
    setAgree(false);
    setErrors({});
    try {
      sessionStorage.removeItem(REG_KEY);
    } catch {
      // Nothing saved — ignore.
    }
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const errs = {
      name: name.trim().length === 1 ? strings.validation.minLength(p.fullName, 2) : undefined,
      phone: !getCountry(phone.country).phonePattern.test(phone.number) ? strings.validation.phone : undefined,
      email: email.trim() && !isEmail(email.trim()) ? strings.validation.email : undefined,
      agree: agree ? undefined : p.agreeRequired,
    };
    setErrors(errs);
    if (Object.values(errs).some(Boolean)) return;
    const reg = { name: name.trim(), email: email.trim(), phone };
    saveRegistration(reg);
    onNext(reg);
  };

  return (
    <div className="grid gap-5 md:grid-cols-[1.4fr_1fr]">
      <form onSubmit={submit} noValidate className="flex flex-col gap-3">
        <div>
          <h1 className="text-xl">{p.createAccount}</h1>
          <p className="text-sm text-muted">{p.createLead}</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Input label={p.fullName} optional placeholder={p.namePlaceholder} value={name} onChange={(e) => setName(e.target.value)} error={errors.name} autoComplete="name" />
          <PhoneInput value={phone} onChange={setPhone} error={errors.phone} />
          <Input
            label={p.emailOptional}
            optional
            type="email"
            placeholder={p.emailPlaceholder}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={errors.email}
            autoComplete="email"
            containerClassName="sm:col-span-2"
          />
        </div>
        <div>
          <Checkbox label={p.agree} checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          {errors.agree && (
            <p role="alert" className="text-xs text-error">
              {errors.agree}
            </p>
          )}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
          <p className="text-sm text-muted">
            {p.haveAccount}{" "}
            <button type="button" onClick={onLogin} className="rounded-control font-medium text-accent hover:underline focus-ring">
              {p.login}
            </button>
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="secondary" onClick={clearForm}>
              {strings.common.cancel}
            </Button>
            <Button type="submit" rightIcon={<ArrowRight size={16} aria-hidden />}>
              {strings.common.continue}
            </Button>
          </div>
        </div>
      </form>
      <Promo />
    </div>
  );
}

/** B1 — Tailor portal entry: Register (steps 1–2 of 7) for new tailors, OTP login for existing partners. */
export function TailorEntry() {
  const router = useRouter();
  const session = useSession("tailor");
  const afterLogin = useAfterLogin();
  const [mode, setMode] = useState<"login" | "register" | "verify">("login");
  const [reg, setReg] = useState<Registration | null>(null);

  // Already signed in → route by onboarding status.
  useEffect(() => {
    if (!session) return;
    tailorApi.me().then((profile) => router.replace(homeFor(profile)), () => undefined);
  }, [session, router]);

  if (session === undefined || session) return <ListSkeleton rows={2} className="mx-auto w-full max-w-md px-4 py-10" />;

  if (mode === "register")
    return (
      <OnboardingFrame
        step={ONBOARDING.register}
        signedIn={false}
        wide
        onStep={() => setMode("verify")}
        canStep={(i) => i === ONBOARDING.otp && reg !== null}
      >
        <RegisterStep
          onLogin={() => setMode("login")}
          onNext={(r) => {
            setReg(r);
            setMode("verify");
          }}
        />
      </OnboardingFrame>
    );

  if (mode === "verify" && reg)
    return (
      <OnboardingFrame
        step={ONBOARDING.otp}
        signedIn={false}
        title={p.verifyTitle}
        lead={p.verifyLead}
        onStep={() => setMode("register")}
        canStep={(i) => i === ONBOARDING.register}
      >
        <div className="max-w-sm">
          <OtpLogin portal="tailor" initialPhone={reg.phone.number} initialName={reg.name} submitLabel={strings.common.continue} onSuccess={afterLogin} />
          <Button variant="text" size="sm" className="mt-3" onClick={() => setMode("register")}>
            {strings.common.back}
          </Button>
        </div>
      </OnboardingFrame>
    );

  return (
    <main className="grid min-h-dvh flex-1 lg:grid-cols-[54%_1fr]">
      {/* Left: brand story over the studio photo (reference: Tailor Partner Portal login). */}
      <section className="relative overflow-hidden bg-blush-wash">
        {/* Photo anchored bottom-right (fabrics low, wall above blends into the wash), so the copy sits on the wall. */}
        <div className="absolute right-0 bottom-0 aspect-[1672/941] w-[135%] [mask-image:linear-gradient(to_bottom,transparent,black_30%)] lg:w-[150%]">
          <Photo image={media.tailorLogin} className="absolute inset-0 bg-transparent" sizes="(min-width: 1280px) 80vw, 135vw" priority unoptimized />
        </div>
        <div aria-hidden className="absolute inset-0 bg-linear-to-r from-blush via-blush/85 to-blush/0 lg:via-blush/70" />
        <LeafOrnament className="absolute -bottom-4 -left-4 hidden w-24 opacity-60 lg:block" />
        <div className="relative flex h-full flex-col gap-6 px-5 py-6 md:px-10 lg:justify-between lg:py-10">
          <Logo href={routes.home} tagline={p.partnerPortal} />
          <div className="flex max-w-md flex-col gap-4">
            <p className="text-xs font-medium tracking-[0.2em] text-accent uppercase">{p.heroEyebrow}</p>
            <h1 className="text-3xl leading-tight md:text-[2.5rem]">{p.heroTitle}</h1>
            <p className="text-sm leading-relaxed text-text md:text-base">{p.heroLead}</p>
            <ul className="mt-1 hidden flex-col gap-3 sm:flex">
              {p.heroPoints.map((point, i) => {
                const Icon = HERO_ICONS[i];
                return (
                  <li key={point} className="flex items-center gap-3 text-sm text-text">
                    <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-surface/80 text-accent shadow-card">
                      <Icon size={17} strokeWidth={1.6} aria-hidden />
                    </span>
                    <span className="max-w-44 leading-snug">{point}</span>
                  </li>
                );
              })}
            </ul>
          </div>
          <div className="hidden flex-col gap-2 lg:flex">
            <span aria-hidden className="h-px w-10 bg-accent/50" />
            <p className="text-xs tracking-[0.2em] text-accent uppercase">{p.heroFooter}</p>
          </div>
        </div>
      </section>

      {/* Right: Login | Register card. */}
      <section className="flex items-center justify-center px-4 py-8 md:px-8">
        <div className="w-full max-w-md rounded-card border border-border bg-surface p-5 shadow-card md:p-7">
          <div role="tablist" aria-label={p.partnerPortal} className="mb-6 grid grid-cols-2 border-b border-border">
            <button role="tab" aria-selected type="button" className="-mb-px border-b-2 border-accent pb-2.5 text-sm font-medium text-accent focus-ring">
              {p.loginTabs.login}
            </button>
            <button role="tab" aria-selected={false} type="button" onClick={() => setMode("register")} className="-mb-px border-b-2 border-transparent pb-2.5 text-sm text-muted hover:text-text focus-ring">
              {p.loginTabs.register}
            </button>
          </div>
          <p className="text-xs font-medium tracking-[0.18em] text-accent uppercase">{p.loginEyebrow}</p>
          <h2 className="mt-1 text-2xl">{p.loginTitle}</h2>
          <p className="mb-5 text-sm text-muted">{p.loginLead}</p>
          <OtpLogin
            portal="tailor"
            onSuccess={afterLogin}
            sendLabel={
              <>
                {p.sendOtp} <ArrowRight size={16} aria-hidden />
              </>
            }
          />
          <div className="my-5 flex items-center gap-3 text-xs text-muted">
            <span className="h-px flex-1 bg-border" />
            {p.or}
            <span className="h-px flex-1 bg-border" />
          </div>
          <div className="flex items-center gap-3 rounded-card bg-blush-wash p-3.5">
            <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-surface text-accent">
              <UserPlus size={18} strokeWidth={1.6} aria-hidden />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-sm font-semibold text-primary">{p.newTailorTitle}</span>
              <span className="text-xs text-muted">{p.newTailorBody}</span>
            </span>
            <Button size="sm" variant="secondary" onClick={() => setMode("register")} className="shrink-0">
              {p.registerNow}
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
