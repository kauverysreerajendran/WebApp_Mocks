"use client";

import { OrdersBoard } from "./OrdersList";

/** Completed Orders (reference screen 5): the orders board fixed to the Completed tab. */
export function CompletedOrders() {
  return <OrdersBoard fixedTab="completed" />;
}
