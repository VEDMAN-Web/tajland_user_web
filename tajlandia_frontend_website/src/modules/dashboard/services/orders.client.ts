import { authedGet } from "@/lib/api/browser-client";
import {
  orderDetailSchema,
  orderListSchema,
  type OrderDetail,
  type OrderListEntry,
} from "../schemas/orders.schema";

/**
 * All of the signed-in user's orders, newest first, in every status. The API
 * has no filter, sort or paging params, so My Purchases does those itself.
 */
export function getOrders(signal?: AbortSignal): Promise<OrderListEntry[]> {
  return authedGet("/orders", orderListSchema, { signal });
}

/** One order with its plots and totals. 400 for a malformed id, 404 when it isn't the user's. */
export function getOrderDetail(orderId: string, signal?: AbortSignal): Promise<OrderDetail> {
  return authedGet(`/orders/${encodeURIComponent(orderId)}`, orderDetailSchema, { signal });
}
