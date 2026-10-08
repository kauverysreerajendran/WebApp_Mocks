"use client";

import { Check } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button, ButtonLink, DateField, ErrorState, ListSkeleton, Select, Textarea, useToast } from "@/components/ui";
import { routes } from "@/config/routes";
import { strings } from "@/i18n";
import { errorMessage } from "@/lib/api/client";
import { tailorApi } from "@/lib/api/endpoints";
import type { OrderStatus } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { formatDate, formatMoney } from "@/lib/format";
import { useApi } from "@/lib/hooks/useApi";
import { TAILOR_FLOW, nextTailorStatus } from "@/lib/status";
import { OrderThumb } from "@/features/orders/OrderParts";
import { STAGE_FLOW, STAGE_OF, StageBadge, dueDateOf, panel } from "./portal";

const p = strings.tailorPortal;

/** Horizontal New → … → Completed progress, as on the reference screen. */
function StageStepper({ status }: { status: OrderStatus }) {
  const reached = STAGE_FLOW.indexOf(STAGE_OF[status]);
  return (
    <ol className="grid grid-cols-5">
      {STAGE_FLOW.map((stage, i) => {
        const done = i < reached;
        const current = i === reached;
        return (
          <li key={stage} className="relative flex flex-col items-center gap-1.5 text-center">
            {i > 0 && <span aria-hidden className={cn("absolute top-[11px] right-1/2 left-[-50%] h-px", i <= reached ? "bg-accent" : "bg-border-strong")} />}
            <span
              className={cn(
                "relative z-10 inline-flex size-6 items-center justify-center rounded-full border-2 text-[0.6875rem] font-semibold",
                done ? "border-accent bg-accent text-on-accent" : current ? "border-accent bg-accent text-on-accent ring-4 ring-accent/15" : "border-border-strong bg-surface text-muted",
              )}
              aria-current={current ? "step" : undefined}
            >
              {done ? <Check size={12} strokeWidth={3} aria-hidden /> : i + 1}
            </span>
            <span className={cn("text-xs leading-tight", current ? "font-semibold text-text" : "text-muted")}>{p.stages[stage]}</span>
          </li>
        );
      })}
    </ol>
  );
}

/** Update Order Status (reference screen 4). The tailor can only move one step forward. */
export function UpdateOrderStatus() {
  const { id } = useParams<{ id: string }>();
  const orderId = Number(id);
  const router = useRouter();
  const toast = useToast();
  const { data: order, status, reload } = useApi(`tailor-order:${orderId}`, () => tailorApi.order(orderId));
  const [remarks, setRemarks] = useState("");
  const [eta, setEta] = useState<Date | undefined>();
  const [saving, setSaving] = useState(false);

  if (status === "loading") return <ListSkeleton rows={4} />;
  if (status === "error" || !order) return <ErrorState onRetry={reload} />;

  const next = nextTailorStatus(order.status);
  const later = TAILOR_FLOW.slice(TAILOR_FLOW.indexOf(order.status) + 1);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!next) return;
    const note = [remarks.trim(), eta ? p.estNote(formatDate(eta)) : ""].filter(Boolean).join(" · ");
    setSaving(true);
    try {
      await tailorApi.advance(order.id, next, note || undefined);
      toast.success(p.updated(strings.status.order[next]));
      router.push(routes.tailor.order(order.id));
    } catch (err) {
      toast.error(errorMessage(err));
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl">{p.updateTitle(order.id)}</h1>
      <section className={cn(panel, "px-2 py-4")}>
        <StageStepper status={order.status} />
      </section>

      <form onSubmit={submit} noValidate className="grid items-start gap-4 lg:grid-cols-[1fr_18rem]">
        <section className={cn(panel, "flex flex-col gap-4 p-4")}>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-muted">{p.currentStatus}</span>
            <StageBadge status={order.status} />
          </div>
          {next ? (
            <>
              <Select
                label={p.updateToLabel}
                value={next}
                onChange={() => undefined}
                options={later.map((s) => ({ value: s, label: strings.status.order[s], disabled: s !== next }))}
                hint={strings.tailor.updateTo(strings.status.order[next])}
              />
              <Textarea label={p.remarks} rows={3} placeholder={p.remarksPlaceholder} value={remarks} onChange={(e) => setRemarks(e.target.value)} />
              <DateField label={p.estCompletion} value={eta} onChange={setEta} disablePast maxDays={90} />
            </>
          ) : (
            <p className="text-sm text-muted">{p.noFurther}</p>
          )}
        </section>

        <aside className="flex flex-col gap-4">
          <section className={cn(panel, "p-4")} aria-labelledby="summary-title">
            <h2 id="summary-title" className="mb-3 text-sm font-semibold">
              {p.orderSummary}
            </h2>
            <div className="mb-3 flex items-center gap-3">
              <OrderThumb alt={order.serviceName} className="size-14" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-primary">{order.serviceName}</p>
                <p className="text-xs text-muted">{strings.common.order} {strings.common.orderNo(order.id)}</p>
              </div>
            </div>
            <dl className="flex flex-col gap-1.5 text-sm">
              {[
                [strings.tailor.customer, order.contactName],
                [p.service, `${order.serviceName} · ${order.packageName}`],
                [p.amount, formatMoney(order.total, order.currency)],
                [p.dueDate, formatDate(dueDateOf(order))],
              ].map(([k, v]) => (
                <div key={k} className="grid grid-cols-[5.5rem_1fr] gap-2">
                  <dt className="text-muted">{k}</dt>
                  <dd className="text-text">{v}</dd>
                </div>
              ))}
            </dl>
          </section>
          <div className="flex gap-2">
            <ButtonLink href={routes.tailor.order(order.id)} variant="secondary" className="flex-1">
              {p.cancel}
            </ButtonLink>
            {next && (
              <Button type="submit" loading={saving} className="flex-1">
                {p.updateStatus}
              </Button>
            )}
          </div>
        </aside>
      </form>
    </div>
  );
}
