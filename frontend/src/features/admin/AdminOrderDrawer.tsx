"use client";

import { Drawer, ErrorState, ListSkeleton, SectionTitle } from "@/components/ui";
import { strings } from "@/i18n";
import { adminApi } from "@/lib/api/endpoints";
import { formatDateTime } from "@/lib/format";
import { useApi } from "@/lib/hooks/useApi";
import {
  ContactCard,
  DesignCard,
  MeasurementCard,
  OrderStatusBadge,
  OrderTimeline,
  PriceCard,
} from "@/features/orders/OrderParts";

/** C2 — order detail drawer shared by all admin order screens. */
export function AdminOrderDrawer({ orderId, onClose }: { orderId: number | null; onClose: () => void }) {
  const { data: order, status, reload } = useApi(orderId ? `admin-order:${orderId}` : null, () =>
    adminApi.order(orderId!),
  );

  return (
    <Drawer
      open={orderId !== null}
      onClose={onClose}
      title={orderId ? `${strings.common.order} ${strings.common.orderNo(orderId)}` : ""}
    >
      {status === "loading" || !order || order.id !== orderId ? (
        status === "error" ? <ErrorState onRetry={reload} /> : <ListSkeleton rows={3} />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <OrderStatusBadge status={order.status} />
            <span className="text-xs text-muted">{formatDateTime(order.createdAt)}</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-control border border-border bg-surface-muted px-3 py-2.5">
              <p className="text-xs text-muted">{strings.orderDetail.tailor}</p>
              <p className="font-medium">{order.tailor?.name ?? strings.orderDetail.notAssigned}</p>
            </div>
            <div className="rounded-control border border-border bg-surface-muted px-3 py-2.5">
              <p className="text-xs text-muted">{strings.orderDetail.executive}</p>
              <p className="font-medium">{order.executive?.name ?? strings.orderDetail.notAssigned}</p>
            </div>
          </div>
          <ContactCard order={order} />
          <DesignCard order={order} />
          <MeasurementCard order={order} />
          <PriceCard order={order} />
          <div className="rounded-card border border-border bg-surface p-4">
            <SectionTitle>{strings.orderDetail.timeline}</SectionTitle>
            <OrderTimeline status={order.status} events={order.events} audience="staff" />
          </div>
        </div>
      )}
    </Drawer>
  );
}
