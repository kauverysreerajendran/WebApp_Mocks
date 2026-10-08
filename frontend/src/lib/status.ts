import type { BadgeTone } from "@/components/ui";
import type { OrderStatus, PaymentStatus, SettlementStatus, TailorStatus } from "@/lib/api/types";

export const ORDER_TONE: Record<OrderStatus, BadgeTone> = {
  placed: "warning",
  assigned: "warning",
  accepted: "info",
  measurement_done: "info",
  stitching: "info",
  ready: "accent",
  delivered: "success",
  cancelled: "error",
};

export const TAILOR_TONE: Record<TailorStatus, BadgeTone> = {
  draft: "neutral",
  pending: "warning",
  approved: "success",
  rejected: "error",
};

export const PAYMENT_TONE: Record<PaymentStatus, BadgeTone> = {
  pending: "warning",
  paid: "success",
  void: "neutral",
};

export const SETTLEMENT_TONE: Record<SettlementStatus, BadgeTone> = {
  pending: "warning",
  processing: "info",
  paid: "success",
};

/** Order of stages shown on timelines. */
export const ORDER_FLOW: OrderStatus[] = [
  "placed",
  "assigned",
  "accepted",
  "measurement_done",
  "stitching",
  "ready",
  "delivered",
];

/** The tailor's own linear workflow (Order Status screen). */
export const TAILOR_FLOW: OrderStatus[] = ["accepted", "measurement_done", "stitching", "ready", "delivered"];

export function nextTailorStatus(status: OrderStatus): OrderStatus | null {
  const i = TAILOR_FLOW.indexOf(status);
  return i >= 0 && i < TAILOR_FLOW.length - 1 ? TAILOR_FLOW[i + 1] : null;
}

/** Still moving through the flow (not delivered or cancelled). */
export function isActiveOrder(status: OrderStatus): boolean {
  return status !== "delivered" && status !== "cancelled";
}

export const ALL_ORDER_STATUSES: OrderStatus[] = [...ORDER_FLOW, "cancelled"];
