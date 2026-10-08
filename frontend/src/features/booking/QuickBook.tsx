"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent, type ReactNode } from "react";
import { Button, DateField, ErrorState, Input, ListSkeleton, Modal, PhoneInput, PriceTag, Select, Textarea, useToast } from "@/components/ui";
import { DEFAULT_COUNTRY } from "@/config/app";
import { COUNTRIES, getCountry, type CountryCode } from "@/config/countries";
import { routes } from "@/config/routes";
import { strings } from "@/i18n";
import { errorMessage } from "@/lib/api/client";
import { catalogApi, customerApi } from "@/lib/api/endpoints";
import type { OrderCreate, ServiceDetail } from "@/lib/api/types";
import { useSession } from "@/lib/auth/session";
import { formatMoney } from "@/lib/format";
import { useApi } from "@/lib/hooks/useApi";
import { isEmail } from "@/lib/validation";
import { OtpLogin } from "@/features/auth/OtpLogin";
import { formatSlot } from "@/features/orders/OrderParts";
import { fromIsoDate, toIsoDate } from "./steps";

const q = strings.quickBook;
const FORM_ID = "quick-book-form";

interface FormState {
  serviceSlug: string;
  packageId: string;
  visitDate: string | null;
  visitSlot: string;
  name: string;
  phone: string;
  phoneCountry: CountryCode;
  email: string;
  address: string;
  city: string;
  postalCode: string;
  notes: string;
}
type Errors = Partial<Record<keyof FormState, string>>;

/** Standard design: the lowest-priced option in each choice group (first on ties), toggles at their defaults. */
function defaultDesign(service: ServiceDetail) {
  const choices = service.optionGroups.filter((g) => g.kind === "choice" && g.options.length);
  const toggles = service.optionGroups.filter((g) => g.kind === "toggle");
  const cheapest = (g: ServiceDetail["optionGroups"][number]) =>
    g.options.reduce((best, o) => (o.priceDelta < best.priceDelta ? o : best)).key;
  return {
    selections: Object.fromEntries(choices.map((g) => [g.key, cheapest(g)])),
    toggles: Object.fromEntries(toggles.map((g) => [g.key, g.defaultOn])),
  };
}

function validate(f: FormState): Errors {
  const country = getCountry(f.phoneCountry);
  const req = strings.validation.required;
  return Object.fromEntries(
    Object.entries({
      serviceSlug: !f.serviceSlug && strings.validation.choose(q.service),
      packageId: !f.packageId && strings.validation.choose(q.package),
      visitDate: !f.visitDate && req(q.visitDate),
      visitSlot: !f.visitSlot && strings.validation.choose(strings.booking.visitSlot),
      name: f.name.trim().length < 2 && req(strings.fields.name),
      phone: !country.phonePattern.test(f.phone) && strings.validation.phone,
      email: !isEmail(f.email.trim()) && strings.validation.email,
      address: f.address.trim().length < 5 && req(strings.fields.address),
      city: f.city.trim().length < 2 && req(strings.fields.city),
      postalCode: !country.postalPattern.test(f.postalCode.trim()) && strings.validation.postal(strings.fields[country.postalLabelKey]),
    }).filter(([, v]) => v),
  ) as Errors;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="mb-3 text-xs font-semibold tracking-[0.12em] text-accent uppercase">{title}</legend>
      {children}
    </fieldset>
  );
}

/**
 * One-screen booking popup. Creates a real order (orders table) with the standard design for the
 * chosen package and a measurement visit; guests verify their mobile by OTP before it is placed.
 */
export function QuickBookDialog({ open, onClose, initialService }: { open: boolean; onClose: () => void; initialService?: string }) {
  const session = useSession("customer");
  const router = useRouter();
  const toast = useToast();
  const user = session?.user;

  const [form, setForm] = useState<FormState>(() => ({
    serviceSlug: initialService ?? "",
    packageId: "",
    visitDate: null,
    visitSlot: "",
    name: user?.name ?? "",
    phone: user?.phone ?? "",
    phoneCountry: user && user.countryCode in COUNTRIES ? (user.countryCode as CountryCode) : DEFAULT_COUNTRY,
    email: user?.email ?? "",
    address: user?.address ?? "",
    city: user?.city ?? "",
    postalCode: user?.postalCode ?? "",
    notes: "",
  }));
  const [errors, setErrors] = useState<Errors>({});
  const [step, setStep] = useState<"form" | "verify">("form");
  const [placing, setPlacing] = useState(false);

  const services = useApi(open ? "services" : null, catalogApi.services);
  const meta = useApi(open ? "booking-meta" : null, catalogApi.bookingMeta);
  const detail = useApi(open && form.serviceSlug ? `service:${form.serviceSlug}` : null, () => catalogApi.service(form.serviceSlug));
  const service = detail.data?.slug === form.serviceSlug ? detail.data : undefined;
  const pkg = service?.packages.find((p) => String(p.id) === form.packageId);
  // Server-side price for the standard design (measurement method doesn't change the price; visit fee added below).
  const quote = useApi(service && pkg ? `quick-quote:${service.id}:${pkg.id}` : null, () =>
    catalogApi.quote({
      serviceId: service!.id,
      packageId: pkg!.id,
      ...defaultDesign(service!),
      measurementMethod: "self",
      measurementUnit: "cm",
      measurements: null,
      visitDate: null,
      visitSlot: null,
    }),
  );
  const total = quote.data && pkg && quote.data.packagePrice === pkg.basePrice ? quote.data.total + (meta.data?.visitFee ?? 0) : null;

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const payload = (): OrderCreate | null => {
    if (!service || !pkg) return null;
    return {
      serviceId: service.id,
      packageId: pkg.id,
      ...defaultDesign(service),
      measurementMethod: "visit",
      measurementUnit: null,
      measurements: null,
      visitDate: form.visitDate,
      visitSlot: form.visitSlot,
      contact: {
        name: form.name.trim(),
        phone: form.phone,
        email: form.email.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        postalCode: form.postalCode.trim(),
        countryCode: form.phoneCountry,
      },
      notes: form.notes.trim() || null,
    };
  };

  const placeOrder = async () => {
    const body = payload();
    if (!body) return;
    setPlacing(true);
    try {
      const order = await customerApi.placeOrder(body);
      toast.success(q.placed(order.id));
      onClose();
      router.push(routes.confirmation(order.id));
    } catch (err) {
      toast.error(errorMessage(err));
      setStep("form");
    } finally {
      setPlacing(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const next = validate(form);
    setErrors(next);
    if (Object.keys(next).length) return;
    if (session) void placeOrder();
    else setStep("verify");
  };

  const loading = !services.data || !meta.data;
  const failed = services.status === "error" || meta.status === "error";

  const footer =
    step === "form" && !loading ? (
      <div className="flex w-full items-center justify-between gap-3">
        <div className="flex flex-col">
          <span className="text-xs text-muted">{q.estimate}</span>
          <span className="flex items-baseline gap-2">
            <PriceTag>{total !== null ? formatMoney(total, quote.data!.currency) : "—"}</PriceTag>
            <span className="text-xs text-muted">· {q.payOnDelivery}</span>
          </span>
        </div>
        <Button type="submit" form={FORM_ID} loading={placing} rightIcon={<ArrowRight size={16} aria-hidden />}>
          {q.submit}
        </Button>
      </div>
    ) : undefined;

  let body: ReactNode;
  if (failed) body = <ErrorState onRetry={() => (services.reload(), meta.reload())} />;
  else if (loading) body = <ListSkeleton rows={4} />;
  else if (step === "verify")
    body = (
      <div className="flex flex-col gap-3">
        <div>
          <h3 className="text-base">{q.verifyTitle}</h3>
          <p className="text-sm text-muted">{q.verifyBody}</p>
        </div>
        <OtpLogin portal="customer" initialPhone={form.phone} submitLabel={q.submit} onSuccess={() => void placeOrder()} />
        <Button variant="text" size="sm" className="self-start" leftIcon={<ArrowLeft size={14} aria-hidden />} onClick={() => setStep("form")}>
          {q.back}
        </Button>
      </div>
    );
  else {
    const country = getCountry(form.phoneCountry);
    body = (
      <form id={FORM_ID} onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
        <p className="-mt-1 text-sm text-muted">{q.lead}</p>

        <Section title={q.serviceSection}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Select
              label={q.service}
              placeholder={q.selectService}
              value={form.serviceSlug}
              onChange={(e) => {
                set("serviceSlug", e.target.value);
                set("packageId", "");
              }}
              options={services.data!.map((s) => ({ value: s.slug, label: s.name }))}
              error={errors.serviceSlug}
            />
            <Select
              label={q.package}
              placeholder={form.serviceSlug && !service ? strings.common.loading : q.selectPackage}
              value={form.packageId}
              onChange={(e) => set("packageId", e.target.value)}
              options={(service?.packages ?? []).map((p) => ({ value: String(p.id), label: `${p.name} · ${formatMoney(p.basePrice)}` }))}
              disabled={!service}
              error={errors.packageId}
              hint={pkg?.description}
            />
          </div>
          <p className="text-xs text-muted">
            {q.designNote}{" "}
            <Link href={form.serviceSlug ? routes.bookService(form.serviceSlug) : routes.book} onClick={onClose} className="font-medium text-accent hover:underline focus-ring">
              {q.designLink}
            </Link>
            .
          </p>
        </Section>

        <Section title={q.visitSection}>
          <div className="grid gap-3 sm:grid-cols-2">
            <DateField
              label={q.visitDate}
              value={fromIsoDate(form.visitDate)}
              onChange={(d) => set("visitDate", d ? toIsoDate(d) : null)}
              disablePast
              maxDays={meta.data!.maxAdvanceDays}
              error={errors.visitDate}
            />
            <Select
              label={strings.booking.visitSlot}
              placeholder={strings.datePicker.timePlaceholder}
              value={form.visitSlot}
              onChange={(e) => set("visitSlot", e.target.value)}
              options={meta.data!.visitSlots.map((s) => ({ value: s, label: formatSlot(s) }))}
              error={errors.visitSlot}
            />
          </div>
        </Section>

        <Section title={q.detailsSection}>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label={strings.fields.name} value={form.name} onChange={(e) => set("name", e.target.value)} error={errors.name} autoComplete="name" />
            <PhoneInput
              value={{ country: form.phoneCountry, number: form.phone }}
              onChange={(v) => {
                set("phone", v.number);
                set("phoneCountry", v.country);
              }}
              error={errors.phone}
            />
            <Input
              label={strings.fields.email}
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              error={errors.email}
              autoComplete="email"
              containerClassName="sm:col-span-2"
            />
            <Input
              label={strings.fields.address}
              placeholder={strings.fields.addressHint}
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              error={errors.address}
              autoComplete="street-address"
              containerClassName="sm:col-span-2"
            />
            <Input label={strings.fields.city} value={form.city} onChange={(e) => set("city", e.target.value)} error={errors.city} autoComplete="address-level2" />
            <Input
              label={strings.fields[country.postalLabelKey]}
              value={form.postalCode}
              onChange={(e) => set("postalCode", e.target.value)}
              error={errors.postalCode}
              autoComplete="postal-code"
              inputMode={form.phoneCountry === "IN" ? "numeric" : "text"}
            />
            <Textarea
              label={strings.fields.notes}
              optional
              rows={2}
              placeholder={strings.fields.notesHint}
              value={form.notes}
              onChange={(e) => set("notes", e.target.value)}
              containerClassName="sm:col-span-2"
            />
          </div>
        </Section>
      </form>
    );
  }

  return (
    <Modal open={open} onClose={onClose} title={q.title} size="lg" footer={footer}>
      {body}
    </Modal>
  );
}

/** Button that opens the booking popup instead of navigating to the full flow. */
export function QuickBookButton({ children, className, service }: { children: ReactNode; className?: string; service?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button className={className} onClick={() => setOpen(true)} rightIcon={<ArrowRight size={16} aria-hidden />}>
        {children}
      </Button>
      {/* Remount on each open so the form starts fresh and picks up the latest session details. */}
      {open && <QuickBookDialog open onClose={() => setOpen(false)} initialService={service} />}
    </>
  );
}
