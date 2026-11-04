import { authedGet } from "@/lib/api/browser-client";
import {
  orderDetailSchema,
  orderListSchema,
  type OrderDetail,
  type OrderListEntry,
} from "../schemas/orders.schema";

/** `GET /orders` sortBy values (the sort panel's options). */
export type OrdersSortBy =
  | "recommended"
  | "price_low_to_high"
  | "price_high_to_low"
  | "area_low_to_high"
  | "area_high_to_low"
  | "newest";

/**
 * What `GET /orders` filters and sorts on, per order (so Rai and price are the order's totals).
 * It has no purchase type, zone or status param (those answer 400), and Rai/price min above max
 * answers 400 too.
 */
export type OrdersQuery = {
  minRai?: number;
  maxRai?: number;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: OrdersSortBy;
};

// The API's largest page. It answers a bare array with no total, so a full page may have more.
const ORDERS_PAGE_SIZE = 100;
const MAX_ORDER_PAGES = 10;

/**
 * The signed-in user's orders, newest first by default and in every status, filtered and sorted
 * by the API, following its pages.
 */
export async function getOrders(query: OrdersQuery = {}, signal?: AbortSignal): Promise<OrderListEntry[]> {
  const orders: OrderListEntry[] = [];
  for (let page = 1; page <= MAX_ORDER_PAGES; page += 1) {
    const items = await authedGet("/orders", orderListSchema, {
      query: { ...query, page, limit: ORDERS_PAGE_SIZE },
      signal,
    });
    orders.push(...items);
    if (items.length < ORDERS_PAGE_SIZE) break;
  }
  return orders;
}

/** One order with its plots and totals. 400 for a malformed id, 404 when it isn't the user's. */
export function getOrderDetail(orderId: string, signal?: AbortSignal): Promise<OrderDetail> {
  return authedGet(`/orders/${encodeURIComponent(orderId)}`, orderDetailSchema, { signal });
}
