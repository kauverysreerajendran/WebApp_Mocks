"use client";

import { ArrowRight, Check, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { Badge, Button, Card, DescriptionList, FileUpload, Input, Textarea, useToast } from "@/components/ui";
import { routes } from "@/config/routes";
import { strings } from "@/i18n";
import { errorMessage } from "@/lib/api/client";
import { tailorApi } from "@/lib/api/endpoints";
import type { BankDetails, BasicDetails, KycDocType, TailorProfile } from "@/lib/api/types";
import { formatClock } from "@/lib/format";
import { compact, isAccountNumber, isEmail, isIfsc, isPostal } from "@/lib/validation";
import { AvailabilityForm } from "./AvailabilityForm";
import { KYC_DOCS, openDocument } from "./documents";
import { ONBOARDING, OnboardingFrame } from "./OnboardingFrame";
import { readRegistration } from "./TailorEntry";
import { useTailor } from "./TailorContext";

const t = strings.tailor;
const p = strings.tailorPortal;

/** Wizard steps after sign-in. Availability sits inside "Basic Details" on the 7-step progress bar. */
type Step = "register" | "otp" | "details" | "availability" | "documents" | "bank" | "review";
const ORDER: Step[] = ["register", "otp", "details", "availability", "documents", "bank", "review"];
const PROGRESS: Record<Step, number> = {
  register: ONBOARDING.register,
  otp: ONBOARDING.otp,
  details: ONBOARDING.details,
  availability: ONBOARDING.details,
  documents: ONBOARDING.documents,
  bank: ONBOARDING.bank,
  review: ONBOARDING.review,
};

const BANK_DOCS: KycDocType[] = ["bank_details"];
const ID_DOCS = KYC_DOCS.filter((d) => !BANK_DOCS.includes(d));

function firstIncomplete(profile: TailorProfile): Step {
  if (profile.missingSteps.includes("details")) return "details";
  if (profile.missingSteps.includes("availability")) return "availability";
  // Documents are optional: go to them only if the tailor hasn't moved past them yet (no bank account).
  if (profile.missingSteps.includes("kyc")) return profile.documents.length ? "bank" : "documents";
  return "review";
}

function Actions({ onBack, children }: { onBack?: () => void; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
      {onBack ? (
        <Button variant="secondary" onClick={onBack} leftIcon={<ChevronLeft size={16} aria-hidden />}>
          {strings.common.back}
        </Button>
      ) : (
        <span />
      )}
      <div className="flex items-center gap-2">{children}</div>
    </div>
  );
}

const next = <ArrowRight size={16} aria-hidden />;

/** Progress-bar index → the step it opens. */
const STEP_AT: Record<number, Step> = {
  [ONBOARDING.register]: "register",
  [ONBOARDING.otp]: "otp",
  [ONBOARDING.details]: "details",
  [ONBOARDING.documents]: "documents",
  [ONBOARDING.bank]: "bank",
  [ONBOARDING.review]: "review",
};

// ---------- Register / OTP (already done once signed in) ----------

function AccountStep({ step, onNext }: { step: "register" | "otp"; onNext: () => void }) {
  const { profile } = useTailor();
  const reg = readRegistration();
  const phone = profile.phone ?? reg?.phone.number ?? "";
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3 rounded-card border border-success/25 bg-success-soft p-4">
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-success text-on-primary">
          <Check size={16} strokeWidth={3} aria-hidden />
        </span>
        <div className="flex flex-col gap-1 text-sm">
          <p className="font-semibold text-primary">{p.accountDoneTitle}</p>
          <p className="text-text">{p.accountDoneBody(phone)}</p>
          {step === "register" && (profile.ownerName || reg?.name) && (
            <p className="text-muted">
              {profile.ownerName || reg?.name}
              {(profile.email || reg?.email) && ` · ${profile.email || reg?.email}`}
            </p>
          )}
        </div>
      </div>
      <Actions>
        <Button rightIcon={next} onClick={onNext}>
          {strings.common.continue}
        </Button>
      </Actions>
    </div>
  );
}

// ---------- Basic details ----------

function DetailsStep({ onDone }: { onDone: () => void }) {
  const { profile, setProfile } = useTailor();
  const toast = useToast();
  const reg = readRegistration();
  const [v, setV] = useState<BasicDetails>({
    shopName: profile.shopName,
    ownerName: profile.ownerName || reg?.name || "",
    email: profile.email ?? reg?.email ?? "",
    address: profile.address,
    city: profile.city,
    postalCode: profile.postalCode,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof BasicDetails, string>>>({});
  const [saving, setSaving] = useState(false);
  const set = (k: keyof BasicDetails) => (e: { target: { value: string } }) => setV((s) => ({ ...s, [k]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const errs = compact({
      shopName: v.shopName.trim().length < 2 ? strings.validation.required(t.shopName) : undefined,
      ownerName: v.ownerName.trim().length < 2 ? strings.validation.required(t.ownerName) : undefined,
      email: !isEmail(v.email) ? strings.validation.email : undefined,
      address: v.address.trim().length < 5 ? strings.validation.minLength(t.shopAddress, 5) : undefined,
      city: v.city.trim().length < 2 ? strings.validation.required(strings.fields.city) : undefined,
      postalCode: !isPostal(v.postalCode, "IN") ? strings.validation.postal(strings.fields.pincode) : undefined,
    });
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      setProfile(await tailorApi.saveDetails(v));
      onDone();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <div className="grid gap-3 md:grid-cols-2">
        <Input label={t.shopName} value={v.shopName} onChange={set("shopName")} error={errors.shopName} autoComplete="organization" />
        <Input label={t.ownerName} value={v.ownerName} onChange={set("ownerName")} error={errors.ownerName} autoComplete="name" />
        <Input label={strings.fields.phone} value={profile.phone ?? ""} disabled />
        <Input label={strings.fields.email} type="email" value={v.email} onChange={set("email")} error={errors.email} autoComplete="email" />
        <Textarea label={t.shopAddress} rows={2} value={v.address} onChange={set("address")} error={errors.address} containerClassName="md:col-span-2" />
        <Input label={strings.fields.city} value={v.city} onChange={set("city")} error={errors.city} />
        <Input label={strings.fields.pincode} inputMode="numeric" value={v.postalCode} onChange={set("postalCode")} error={errors.postalCode} />
      </div>
      <Actions>
        <Button type="button" variant="text" onClick={onDone}>
          {p.skipForNow}
        </Button>
        <Button type="submit" loading={saving} rightIcon={next}>
          {strings.common.continue}
        </Button>
      </Actions>
    </form>
  );
}

// ---------- Availability (part of Basic Details) ----------

function AvailabilityStep({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const { profile, setProfile } = useTailor();
  const toast = useToast();
  return (
    <AvailabilityForm
      initial={profile}
      submitLabel={strings.common.continue}
      secondary={
        <>
          <Button variant="secondary" onClick={onBack} leftIcon={<ChevronLeft size={16} aria-hidden />}>
            {strings.common.back}
          </Button>
          <Button variant="text" onClick={onDone} className="ml-auto">
            {p.skipForNow}
          </Button>
        </>
      }
      onSubmit={async (value) => {
        try {
          setProfile(await tailorApi.saveAvailability(value));
          onDone();
        } catch (err) {
          toast.error(errorMessage(err));
        }
      }}
    />
  );
}

// ---------- Documents ----------

function useDocumentUpload() {
  const { profile, setProfile } = useTailor();
  const toast = useToast();
  const [uploading, setUploading] = useState<KycDocType | null>(null);
  const docs = new Map(profile.documents.map((d) => [d.docType, d]));

  const slot = (doc: KycDocType) => (
    <FileUpload
      key={doc}
      label={`${strings.kyc[doc]} ${p.optionalTag}`}
      hint={doc === "bank_details" ? strings.kyc.bankDocHint : undefined}
      fileName={docs.get(doc)?.fileName ?? null}
      uploading={uploading === doc}
      disabled={uploading !== null && uploading !== doc}
      onFile={async (file) => {
        setUploading(doc);
        try {
          setProfile(await tailorApi.uploadDocument(doc, file));
        } catch (err) {
          toast.error(errorMessage(err));
        } finally {
          setUploading(null);
        }
      }}
      onPreview={() => openDocument(() => tailorApi.documentUrl(doc)).catch((err) => toast.error(errorMessage(err)))}
    />
  );
  return { docs, slot };
}

/** Reference "Document Upload": Aadhaar, PAN, Shop / Business proof and the bank proof side by side. All optional. */
function DocumentsStep({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const { docs, slot } = useDocumentUpload();
  const missing = KYC_DOCS.some((d) => !docs.has(d));
  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{KYC_DOCS.map(slot)}</div>
      <Actions onBack={onBack}>
        <Button variant={missing ? "secondary" : "primary"} rightIcon={next} onClick={onDone}>
          {missing ? p.skipForNow : strings.common.continue}
        </Button>
      </Actions>
    </div>
  );
}

// ---------- Bank details ----------

function BankStep({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const { profile, setProfile } = useTailor();
  const toast = useToast();
  const [bank, setBank] = useState<BankDetails>({
    bankAccountName: profile.bankAccountName ?? "",
    bankAccountNumber: "",
    bankIfsc: profile.bankIfsc ?? "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof BankDetails, string>>>({});
  const [saving, setSaving] = useState(false);
  const hasAccount = Boolean(profile.bankAccountNumberMasked);
  const empty = !hasAccount && !bank.bankAccountName.trim() && !bank.bankAccountNumber && !bank.bankIfsc.trim();

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    // Optional: validate only when the tailor starts filling it in (a saved account can be kept as is).
    const touched = Boolean(bank.bankAccountNumber || (!hasAccount && (bank.bankAccountName.trim() || bank.bankIfsc.trim())));
    const errs = compact({
      bankAccountName: touched && bank.bankAccountName.trim().length < 2 ? strings.validation.required(t.accountName) : undefined,
      bankAccountNumber: touched && !isAccountNumber(bank.bankAccountNumber) ? strings.validation.accountNumber : undefined,
      bankIfsc: touched && !isIfsc(bank.bankIfsc) ? strings.validation.ifsc : undefined,
    });
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setSaving(true);
    try {
      if (touched) setProfile(await tailorApi.saveBank(bank));
      onDone();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      {hasAccount && <p className="text-sm text-muted">{t.accountOnFile(profile.bankAccountNumberMasked!)}</p>}
      <div className="grid gap-3 md:grid-cols-3">
        <Input label={t.accountName} optional value={bank.bankAccountName} onChange={(e) => setBank((b) => ({ ...b, bankAccountName: e.target.value }))} error={errors.bankAccountName} />
        <Input
          label={t.accountNumber}
          inputMode="numeric"
          value={bank.bankAccountNumber}
          onChange={(e) => setBank((b) => ({ ...b, bankAccountNumber: e.target.value.replace(/\D/g, "") }))}
          error={errors.bankAccountNumber}
          optional
          autoComplete="off"
        />
        <Input label={t.ifsc} optional value={bank.bankIfsc} onChange={(e) => setBank((b) => ({ ...b, bankIfsc: e.target.value.toUpperCase() }))} error={errors.bankIfsc} autoComplete="off" />
      </div>
      <Actions onBack={onBack}>
        <Button type="submit" loading={saving} rightIcon={next} variant={empty ? "secondary" : "primary"}>
          {empty ? p.skipForNow : strings.common.continue}
        </Button>
      </Actions>
    </form>
  );
}

// ---------- Review & submit ----------

function ReviewStep({ onBack, onEdit }: { onBack: () => void; onEdit: (s: Step) => void }) {
  const { profile, setProfile } = useTailor();
  const router = useRouter();
  const toast = useToast();
  const [submitting, setSubmitting] = useState(false);
  const docs = new Set(profile.documents.map((d) => d.docType));

  const submit = async () => {
    setSubmitting(true);
    try {
      setProfile(await tailorApi.submit());
      router.replace(routes.tailor.dashboard);
    } catch (err) {
      toast.error(errorMessage(err));
      setSubmitting(false);
    }
  };

  const section = (title: string, step: Step, items: { label: string; value: ReactNode }[]) => (
    <Card padding="sm" className="md:p-4">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-primary">{title}</h3>
        <Button variant="text" size="sm" onClick={() => onEdit(step)}>
          {strings.common.edit}
        </Button>
      </div>
      <DescriptionList items={items} />
    </Card>
  );

  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 md:grid-cols-2">
        {section(t.detailsTitle, "details", [
          { label: t.shopName, value: profile.shopName },
          { label: t.ownerName, value: profile.ownerName },
          { label: strings.fields.email, value: profile.email },
          { label: t.shopAddress, value: `${profile.address}, ${profile.city} ${profile.postalCode}` },
        ])}
        {section(p.availabilityTitle, "availability", [
          { label: t.workingDays, value: profile.workingDays.map((d) => strings.weekdays[d]).join(", ") },
          { label: t.hoursLabel, value: `${formatClock(profile.openTime)} – ${formatClock(profile.closeTime)}` },
        ])}
        {section(t.documents, "documents", [
          ...ID_DOCS.concat(BANK_DOCS).map((d) => ({
            label: strings.kyc[d],
            value: docs.has(d) ? <Badge tone="success">{strings.upload.uploaded}</Badge> : <Badge tone="neutral">{p.notUploaded}</Badge>,
          })),
        ])}
        {section(p.bankTitle, "bank", [
          ...(profile.bankAccountNumberMasked
            ? [
                { label: t.accountName, value: profile.bankAccountName },
                { label: t.accountNumber, value: profile.bankAccountNumberMasked },
                { label: t.ifsc, value: profile.bankIfsc },
              ]
            : [{ label: t.bank, value: <Badge tone="neutral">{p.bankNotProvided}</Badge> }]),
        ])}
      </div>
      {profile.missingSteps.length > 0 && (
        <p className="rounded-card border border-warning/30 bg-warning-soft px-3 py-2 text-sm text-warning-strong">{p.submitIncomplete}</p>
      )}
      <Actions onBack={onBack}>
        <Button onClick={submit} loading={submitting} rightIcon={next}>
          {t.submit}
        </Button>
      </Actions>
    </div>
  );
}

// ---------- Wizard ----------

const META: Record<Step, { title: string; lead: string }> = {
  register: { title: p.createAccount, lead: p.createLead },
  otp: { title: p.verifyTitle, lead: p.verifyLead },
  details: { title: t.detailsTitle, lead: t.detailsLead },
  availability: { title: p.availabilityTitle, lead: p.availabilityLead },
  documents: { title: p.uploadTitle, lead: p.uploadLead },
  bank: { title: p.bankTitle, lead: p.bankLead },
  review: { title: t.reviewTitle, lead: t.reviewLead },
};

/** Tailor registration, steps 3–6 of 7 (Register and OTP happen on the entry page; Submitted is the status page). */
export function Onboarding() {
  const { profile } = useTailor();
  const router = useRouter();
  const [step, setStep] = useState<Step>(() => {
    // ?step=documents etc. (from the Submitted page's progress bar) opens that form directly.
    const asked = typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("step");
    return asked && (ORDER as string[]).includes(asked) ? (asked as Step) : firstIncomplete(profile);
  });
  const go = (s: Step) => {
    setStep(s);
    window.scrollTo({ top: 0 });
  };
  const at = ORDER.indexOf(step);
  const back = () => go(ORDER[Math.max(0, at - 1)]);
  const forward = () => go(ORDER[Math.min(ORDER.length - 1, at + 1)]);

  return (
    <OnboardingFrame
      step={PROGRESS[step]}
      title={META[step].title}
      lead={META[step].lead}
      onStep={(i) => (i === ONBOARDING.submitted ? router.push(routes.tailor.status) : go(STEP_AT[i]))}
      canStep={(i) => i !== ONBOARDING.submitted || profile.status !== "draft"}
    >
      {profile.status === "rejected" && profile.rejectionReason && (
        <div role="alert" className="mb-4 rounded-card border border-error-soft bg-error-soft p-3 text-sm text-error">
          <strong>{t.reason}:</strong> {profile.rejectionReason}
        </div>
      )}
      {(step === "register" || step === "otp") && <AccountStep step={step} onNext={forward} />}
      {step === "details" && <DetailsStep onDone={forward} />}
      {step === "availability" && <AvailabilityStep onBack={back} onDone={forward} />}
      {step === "documents" && <DocumentsStep onBack={back} onDone={forward} />}
      {step === "bank" && <BankStep onBack={back} onDone={forward} />}
      {step === "review" && <ReviewStep onBack={back} onEdit={go} />}
    </OnboardingFrame>
  );
}
