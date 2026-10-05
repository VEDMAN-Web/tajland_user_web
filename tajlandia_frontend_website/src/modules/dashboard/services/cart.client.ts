import { z } from "zod";
import { authedDelete, authedGet } from "@/lib/api/browser-client";
import {
  cartSchema,
  cartSummarySchema,
  type Cart,
  type CartSummary,
} from "../schemas/cart.schema";

/** The cart's items. `redirectOnUnauthorized: false` for callers like the badge that shouldn't log out. */
export function getCart(
  options: { signal?: AbortSignal; redirectOnUnauthorized?: boolean } = {},
): Promise<Cart> {
  return authedGet("/cart", cartSchema, options);
}

// Delete responses aren't used; `.optional()` because Zod 4 requires a plain `z.unknown()` key.
const ignoredResultSchema = z.unknown().optional();

/** Removes one plot from the cart (the backend also releases its reservation). */
export async function removeCartItem(plotId: string): Promise<void> {
  await authedDelete(`/cart/items/${encodeURIComponent(plotId)}`, ignoredResultSchema);
}

/** Empties the cart and releases every reservation. */
export async function clearCart(): Promise<void> {
  await authedDelete("/cart", ignoredResultSchema);
}

/**
 * The cart's totals: plots, zone amounts, subtotal, discount, total and the
 * 100 Rai minimum check. 404 when the cart has no plots, so skip it when empty.
 */
export function getOrderSummary(signal?: AbortSignal): Promise<CartSummary> {
  return authedGet("/cart/order-summary", cartSummarySchema, { signal });
}
