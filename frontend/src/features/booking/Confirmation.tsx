"use client";

import { CalendarCheck, CircleCheck } from "lucide-react";
import { useParams } from "next/navigation";
import { ButtonLink, Card, ErrorState, ListSkeleton, PriceTag } from "@/components/ui";
import { routes } from "@/config/routes";
import { strings } from "@/i18n";
import { customerApi } from "@/lib/api/endpoints";
import { formatMoney } from "@/lib/format";
import { useApi } from "@/lib/hooks/useApi";
import { RequireSession } from "@/features/auth/RequireSession";
import { DesignCard, formatVisit } from "@/features/orders/OrderParts";

const c = strings.confirmation;

function ConfirmationBody({ id }: { id: number }) {
  const { data: order, status, reload } = useApi(`order:${id}`, () => customerApi.order(id));
  if (status === "loading") return <ListSkeleton rows={3} />;
  if (status === "error" || !order) return <ErrorState onRetry={reload} />;

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex flex-col items-center gap-2 bg-blush-wash text-center">
        <span className="inline-flex size-10 items-center justify-center rounded-full bg-success-soft text-success">
          <CircleCheck size={20} aria-hidden />
        </span>
        <h1 className="text-2xl">{c.title}</h1>
        <p className="max-w-md text-sm text-muted">{c.body(order.id)}</p>
        <p className="text-base font-semibold text-primary">{strings.common.orderNo(order.id)}</p>
        <PriceTag size="lg">{formatMoney(order.total, order.currency)}</PriceTag>
      </Card>

      {order.measurementMethod === "visit" && (
        <Card className="flex items-center gap-3">
          <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-accent-soft text-accent">
            <CalendarCheck size={16} aria-hidden />
          </span>
          <div>
            <h2 className="text-sm font-semibold">{c.visitTitle}</h2>
            <p className="text-sm text-text">{formatVisit(order.visitDate, order.visitSlot)}</p>
            <p className="text-xs text-muted">
              {order.address}, {order.city} {order.postalCode}
            </p>
          </div>
        </Card>
      )}

      <DesignCard order={order} />

      <Card>
        <h2 className="mb-2 text-sm font-semibold">{c.nextTitle}</h2>
        <ol className="flex list-decimal flex-col gap-1.5 pl-5 text-sm text-muted marker:text-accent">
          {c.next.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ol>
      </Card>

      <div className="flex flex-wrap gap-3">
        <ButtonLink href={routes.account}>{c.dashboard}</ButtonLink>
        <ButtonLink href={routes.accountOrder(order.id)} variant="secondary">
          {c.track}
        </ButtonLink>
      </div>
    </div>
  );
}

export function Confirmation() {
  const { id } = useParams<{ id: string }>();
  return (
    <RequireSession role="customer" loginHref={routes.loginNext}>
      {() => <ConfirmationBody id={Number(id)} />}
    </RequireSession>
  );
}
