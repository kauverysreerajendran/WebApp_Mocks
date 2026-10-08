"use client";

import { ArrowRight, ChevronLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react";
import { Button, Card, ErrorState, ListSkeleton, Modal, PriceTag, Select, Stepper, useToast } from "@/components/ui";
import { getCountry } from "@/config/countries";
import { routes } from "@/config/routes";
import { strings } from "@/i18n";
import { errorMessage } from "@/lib/api/client";
import { catalogApi, customerApi } from "@/lib/api/endpoints";
import type { BookingMeta, ServiceDetail } from "@/lib/api/types";
import { sessions, useSession } from "@/lib/auth/session";
import { formatMoney } from "@/lib/format";
import { useApi } from "@/lib/hooks/useApi";
import { cn } from "@/lib/cn";
import { compact, isEmail, isPhone, isPostal } from "@/lib/validation";
import { OtpLogin } from "@/features/auth/OtpLogin";
import {
  STEP,
  clearState,
  emptyContact,
  estimateTotal,
  loadState,
  measurementErrors,
  reducer,
  saveState,
  toOrderPayload,
  type BookingState,
  type StepIndex,
} from "./state";
import { HelpBanner } from "./HelpBanner";
import { DesignStep, DetailsStep, MeasurementStep, PackageStep, ServiceStep, type ContactErrors } from "./steps";
import { SummaryStep } from "./SummaryStep";

const b = strings.booking;

/**
 * Restore saved choices, but always walk the steps in order: open at Select Service, or at Choose
 * Package when ?service= picks one. Prefill contact from the signed-in customer.
 */
function init(preselect: string | null): BookingState {
  let state = loadState();
  if (preselect && preselect !== state.serviceSlug) {
    state = reducer({ ...state, step: STEP.package }, { type: "selectService", slug: preselect });
  } else {
    state = { ...state, step: preselect ? STEP.package : STEP.service };
  }
  const user = sessions.customer.get()?.user;
  if (user && state.contact === emptyContact) {
    state = {
      ...state,
      contact: {
        ...emptyContact,
        name: user.name ?? "",
        phone: user.phone ?? "",
        email: user.email ?? "",
        address: user.address ?? "",
        city: user.city ?? "",
        postalCode: user.postalCode ?? "",
      },
    };
  }
  return state;
}

type Errors = Record<string, string>;

function validateStep(state: BookingState, service: ServiceDetail | undefined): Errors {
  switch (state.step) {
    case STEP.service:
      return state.serviceSlug ? {} : { service: b.selectToContinue };
    case STEP.package:
      return state.packageId ? {} : { package: b.selectToContinue };
    case STEP.design: {
      const errs: Errors = {};
      service?.optionGroups
        .filter((g) => g.kind === "choice" && !state.selections[g.key])
        .forEach((g) => (errs[g.key] = strings.validation.choose(g.label)));
      return errs;
    }
    case STEP.measurements: {
      if (!state.method) return { method: b.selectToContinue };
      if (state.method === "visit") {
        return compact({
          visitDate: state.visitDate ? undefined : strings.validation.required(strings.fields.date),
          visitSlot: state.visitSlot ? undefined : strings.validation.required(b.visitSlot),
        }) as Errors;
      }
      return service ? measurementErrors(state, service) : {};
    }
    case STEP.details: {
      const c = state.contact;
      const postalLabel = strings.fields[getCountry(c.country).postalLabelKey];
      const errs: ContactErrors = compact({
        name: c.name.trim().length < 2 ? strings.validation.required(strings.fields.name) : undefined,
        phone: !isPhone(c.phone, c.phoneCountry) ? strings.validation.phone : undefined,
        email: !isEmail(c.email) ? strings.validation.email : undefined,
        address: c.address.trim().length < 5 ? strings.validation.minLength(strings.fields.address, 5) : undefined,
        city: c.city.trim().length < 2 ? strings.validation.required(strings.fields.city) : undefined,
        postalCode: !isPostal(c.postalCode, c.country) ? strings.validation.postal(postalLabel) : undefined,
      });
      return errs as Errors;
    }
    default:
      return {};
  }
}

export function BookingFlow({ preselect }: { preselect: string | null }) {
  const router = useRouter();
  const toast = useToast();
  const session = useSession("customer");
  const [state, dispatch] = useReducer(reducer, preselect, init);
  const [errors, setErrors] = useState<Errors>({});
  const [loginOpen, setLoginOpen] = useState(false);
  const [placing, setPlacing] = useState(false);
  const headingRef = useRef<HTMLDivElement>(null);

  const services = useApi("services", catalogApi.services);
  const meta = useApi<BookingMeta>("booking-meta", catalogApi.bookingMeta);
  const detail = useApi<ServiceDetail>(state.serviceSlug ? `service:${state.serviceSlug}` : null, () =>
    catalogApi.service(state.serviceSlug!),
  );
  const service = detail.data?.slug === state.serviceSlug ? detail.data : undefined;

  useEffect(() => saveState(state), [state]);

  // Move focus to the step heading on step change for keyboard and screen-reader users.
  const lastStep = useRef(state.step);
  useEffect(() => {
    if (lastStep.current === state.step) return;
    lastStep.current = state.step;
    headingRef.current?.querySelector<HTMLElement>("[data-step-heading]")?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [state.step]);

  const estimate = useMemo(
    () => estimateTotal(state, service, meta.data?.visitFee ?? 0),
    [state, service, meta.data?.visitFee],
  );

  const goTo = (step: StepIndex) => {
    setErrors({});
    dispatch({ type: "goto", step });
  };

  const next = () => {
    const errs = validateStep(state, service);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    if (state.step < STEP.summary) goTo((state.step + 1) as StepIndex);
  };

  const placeOrder = async () => {
    if (!service) return;
    setPlacing(true);
    try {
      const order = await customerApi.placeOrder(toOrderPayload(state, service));
      // Saved progress is cleared; the flow unmounts on navigation, so no in-memory reset (avoids a flash of step 1).
      clearState();
      router.push(routes.confirmation(order.id));
    } catch (err) {
      toast.error(errorMessage(err));
      setPlacing(false);
    }
  };

  const confirm = () => {
    if (!session) setLoginOpen(true);
    else void placeOrder();
  };

  if (services.status === "error" || meta.status === "error") {
    return (
      <div className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8">
        <ErrorState onRetry={() => (services.reload(), meta.reload())} />
      </div>
    );
  }
  if (!services.data || !meta.data) return <ListSkeleton rows={4} className="mx-auto w-full max-w-6xl px-4 py-8 md:px-8" />;

  const needsService = state.step > STEP.service;
  const serviceLoading = needsService && !service && detail.status === "loading";
  const serviceFailed = needsService && !service && detail.status === "error";

  let body: ReactNode;
  if (serviceLoading) body = <ListSkeleton rows={3} />;
  else if (serviceFailed) body = <ErrorState onRetry={detail.reload} />;
  else
    switch (state.step) {
      case STEP.service:
        body = <ServiceStep services={services.data} state={state} dispatch={dispatch} error={errors.service} />;
        break;
      case STEP.package:
        body = <PackageStep service={service!} state={state} dispatch={dispatch} error={errors.package} />;
        break;
      case STEP.design:
        body = <DesignStep service={service!} state={state} dispatch={dispatch} errors={errors} />;
        break;
      case STEP.measurements:
        body = <MeasurementStep service={service!} meta={meta.data} state={state} dispatch={dispatch} errors={errors} />;
        break;
      case STEP.details:
        body = <DetailsStep state={state} dispatch={dispatch} errors={errors} />;
        break;
      default:
        body = <SummaryStep service={service!} meta={meta.data} state={state} onEdit={goTo} />;
    }

  const isSummary = state.step === STEP.summary;
  const pkg = service?.packages.find((p) => p.id === state.packageId);
  // On the first step the panel offers the chosen service's design choices up front (same state as the Design step).
  const panelGroups =
    state.step === STEP.service && service ? service.optionGroups.filter((g) => g.kind === "choice") : [];

  const primaryAction = (fullWidth?: boolean) =>
    isSummary ? (
      <Button onClick={confirm} loading={placing} fullWidth={fullWidth}>
        {b.confirm}
      </Button>
    ) : (
      <Button onClick={next} fullWidth={fullWidth} rightIcon={<ArrowRight size={16} aria-hidden />}>
        {b.nextStep}
      </Button>
    );

  const summaryRow = (label: string, value: ReactNode, strong?: boolean) => (
    <div className="flex justify-between gap-3">
      <dt className="text-muted">{label}</dt>
      <dd className={cn("text-right", strong ? "font-medium text-primary" : "text-text")}>{value}</dd>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 md:px-8 md:py-10">
      <Stepper steps={b.steps} current={state.step} className="mb-6 lg:hidden" />
      <div className="grid gap-6 lg:grid-cols-[8.5rem_minmax(0,1fr)_17.5rem] lg:gap-8">
        {/* Vertical stepper (desktop) */}
        <aside className="hidden border-r border-border pr-6 lg:block">
          <Stepper steps={b.steps} current={state.step} orientation="vertical" className="sticky top-24 pt-1" />
        </aside>

        <div ref={headingRef} className="min-w-0">
          {body}
          <div
            className={cn(
              "sticky bottom-0 z-10 -mx-4 mt-8 flex items-center justify-between gap-3 border-t border-border bg-background/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:p-0",
              state.step === 0 && "lg:hidden",
            )}
          >
            <Button
              variant="secondary"
              size="sm"
              onClick={() => goTo((state.step - 1) as StepIndex)}
              disabled={state.step === 0 || placing}
              leftIcon={<ChevronLeft size={16} aria-hidden />}
            >
              {strings.common.back}
            </Button>
            {estimate !== null && !isSummary && (
              <span className="flex flex-col items-end text-xs text-muted lg:hidden">
                {b.liveTotal}
                <span className="text-sm font-semibold text-primary">{formatMoney(estimate)}</span>
              </span>
            )}
            <div className="lg:hidden">{primaryAction()}</div>
          </div>
        </div>

        {/* Service details / live summary (desktop) */}
        <aside className="hidden lg:block">
          <Card padding="sm" className="sticky top-24 flex flex-col gap-4 p-5">
            <h2 className="text-base font-semibold">{b.panelTitle}</h2>
            {panelGroups.length > 0 ? (
              <div className="flex flex-col gap-3.5">
                {panelGroups.map((g) => (
                  <Select
                    key={g.key}
                    label={g.label}
                    placeholder={b.choosePlaceholder}
                    value={state.selections[g.key] ?? ""}
                    onChange={(e) => e.target.value && dispatch({ type: "select", group: g.key, option: e.target.value })}
                    options={g.options.map((o) => ({ value: o.key, label: o.label }))}
                    className="h-9 text-xs"
                    containerClassName="gap-1 [&>label]:text-xs"
                  />
                ))}
              </div>
            ) : service ? (
              <dl className="flex flex-col gap-2 text-xs">
                {summaryRow(b.sectionService, service.name, true)}
                {pkg && summaryRow(b.packageTitle, pkg.name, true)}
                {service.optionGroups
                  .filter((g) => g.kind === "choice" && state.selections[g.key])
                  .map((g) => (
                    <Fragment key={g.key}>
                      {summaryRow(g.label, g.options.find((o) => o.key === state.selections[g.key])?.label)}
                    </Fragment>
                  ))}
                {state.method && summaryRow(b.sectionMeasurements, strings.measurement[state.method])}
              </dl>
            ) : (
              <p className="text-xs text-muted">{b.panelEmpty}</p>
            )}
            {estimate !== null && (
              <div className="flex items-center justify-between border-t border-border pt-3">
                <span className="text-xs text-muted">{b.liveTotal}</span>
                <PriceTag>{formatMoney(estimate)}</PriceTag>
              </div>
            )}
            <div className="mt-2">{primaryAction(true)}</div>
            <p className="-mt-1 text-center text-xs text-muted">{b.payOnDelivery}</p>
          </Card>
        </aside>
      </div>

      <HelpBanner />

      <Modal open={loginOpen} onClose={() => setLoginOpen(false)} title={b.loginToConfirm} size="sm">
        <p className="mb-3 text-sm text-muted">{b.loginBody}</p>
        <OtpLogin
          portal="customer"
          initialPhone={state.contact.phone}
          submitLabel={b.confirm}
          onSuccess={() => {
            setLoginOpen(false);
            void placeOrder();
          }}
        />
      </Modal>
    </div>
  );
}

