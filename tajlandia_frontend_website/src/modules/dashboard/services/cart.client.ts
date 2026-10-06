import { z } from "zod";
import { authedDelete, authedGet, authedPost } from "@/lib/api/browser-client";
import {
  cartCouponsSchema,
  cartSchema,
  cartSummarySchema,
  checkoutResultSchema,
  orderSchema,
  paymentResultSchema,
  type Cart,
  type Order,
  type PaymentResult,
  type CheckoutInput,
  type CartCoupon,
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
 * 100 Rai minimum check. With `couponId` the discount is applied (400 when the
 * coupon doesn't fit the cart's Rai, 404 when it doesn't exist). 404 for an
 * empty cart, so skip it then.
 */
export function getOrderSummary(
  options: { couponId?: string; signal?: AbortSignal } = {},
): Promise<CartSummary> {
  return authedGet("/cart/order-summary", cartSummarySchema, {
    query: { couponId: options.couponId },
    signal: options.signal,
  });
}

/** Coupons that fit the current cart's Rai (only used to turn a typed code into its id). */
export async function getCartCoupons(signal?: AbortSignal): Promise<CartCoupon[]> {
  const data = await authedGet("/coupons", cartCouponsSchema, { signal });
  return data.coupons;
}

/**
 * Creates the pending order from the cart (prices re-checked on the server).
 * 400: below the minimum / coupon doesn't fit; 404: coupon or plots gone;
 * 409: a plot's reservation expired.
 */
export async function createCheckout(input: CheckoutInput): Promise<string> {
  const data = await authedPost("/checkout", input, checkoutResultSchema);
  return data.orderId;
}

/** Card fields `POST /payments` accepts. Never a full card number or CVC (the API rejects them). */
export type CardPaymentInput = {
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  holderName: string;
  country: string;
};

/**
 * Pays a pending order by card. 400: the order expired; 404: no such order;
 * 409: it isn't pending any more (e.g. already paid).
 */
export function payOrderByCard(
  orderId: string,
  paymentDetails: CardPaymentInput,
): Promise<PaymentResult> {
  return authedPost(
    "/payments",
    { orderId, method: "card", paymentDetails },
    paymentResultSchema,
  );
}

/** One of the user's orders with its payment status and certificate link. */
export function getOrder(orderId: string): Promise<Order> {
  return authedGet(`/orders/${encodeURIComponent(orderId)}`, orderSchema);
}
