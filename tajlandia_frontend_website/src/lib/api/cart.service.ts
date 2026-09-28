/**
 * Cart service layer.
 *
 * Every function maps 1-to-1 with a backend /cart endpoint, validates
 * the response with Zod schema, and returns the typed `.data` payload.
 *
 * All functions are async and throw BrowserApiError on failure.
 */

import { browserDelete, browserGet, browserPost, browserPut } from "@/lib/api/client.browser";
import {
  cartResponseSchema,
  cartValidationResponseSchema,
  checkoutResponseSchema,
  couponResponseSchema,
  successResponseSchema,
  type AddToCartRequest,
  type ApplyCouponRequest,
  type Cart,
  type CartValidation,
  type CheckoutResult,
  type UpdateCartItemRequest,
} from "@/lib/api/cart.schemas";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Validate raw response with a Zod schema, throw on mismatch. */
function validate<T>(
  schema: { safeParse: (v: unknown) => { success: boolean; data?: T; error?: unknown } },
  raw: unknown,
): T {
  const result = schema.safeParse(raw);
  if (!result.success) {
    console.error("[cart service] schema mismatch", result.error);
    throw new Error("Unexpected API response shape");
  }
  return result.data as T;
}

// ─── 1. Get Cart ──────────────────────────────────────────────────────────────

/**
 * GET /cart
 * Retrieve complete shopping cart for authenticated user.
 */
export async function fetchCart(): Promise<Cart> {
  const raw = await browserGet<unknown>("/cart");
  const parsed = validate(cartResponseSchema, raw);
  return parsed.data;
}

// ─── 2. Clear Cart ────────────────────────────────────────────────────────────

/**
 * DELETE /cart
 * Remove all plots from cart and release all reservations.
 */
export async function clearCart(): Promise<void> {
  const raw = await browserDelete<unknown>("/cart");
  validate(successResponseSchema, raw);
}

// ─── 3. Add Item to Cart ──────────────────────────────────────────────────────

/**
 * POST /cart/items
 * Add a reserved plot to shopping cart.
 * Plot must be reserved first before adding to cart.
 */
export async function addItemToCart(plotId: string): Promise<Cart> {
  const body: AddToCartRequest = { plotId };
  const raw = await browserPost<unknown>("/cart/items", body);
  const parsed = validate(cartResponseSchema, raw);
  return parsed.data;
}

// ─── 4. Update Cart Item ──────────────────────────────────────────────────────

/**
 * PUT /cart/items/{plotId}
 * Update rai quantity for a cart item and recalculate pricing.
 */
export async function updateCartItem(plotId: string, rai: number): Promise<Cart> {
  const body: UpdateCartItemRequest = { rai };
  const raw = await browserPut<unknown>(`/cart/items/${plotId}`, body);
  const parsed = validate(cartResponseSchema, raw);
  return parsed.data;
}

// ─── 5. Remove Cart Item ──────────────────────────────────────────────────────

/**
 * DELETE /cart/items/{plotId}
 * Remove a plot from cart and release its reservation.
 */
export async function removeCartItem(plotId: string): Promise<void> {
  const raw = await browserDelete<unknown>(`/cart/items/${plotId}`);
  validate(successResponseSchema, raw);
}

// ─── 6. Validate Cart ─────────────────────────────────────────────────────────

/**
 * POST /cart/validate
 * Validate cart meets minimum requirements (100 rai) before checkout.
 */
export async function validateCart(): Promise<CartValidation> {
  const raw = await browserPost<unknown>("/cart/validate");
  const parsed = validate(cartValidationResponseSchema, raw);
  return parsed.data;
}

// ─── 7. Apply Coupon ──────────────────────────────────────────────────────────

/**
 * POST /cart/coupon
 * Apply discount coupon code to cart.
 */
export async function applyCoupon(code: string): Promise<Cart> {
  const body: ApplyCouponRequest = { code };
  const raw = await browserPost<unknown>("/cart/coupon", body);
  const parsed = validate(couponResponseSchema, raw);
  
  // Return updated cart with discount applied
  // Note: Backend returns discount info, but we need full cart
  // So we fetch cart again to get complete state
  return fetchCart();
}

// ─── 8. Remove Coupon ─────────────────────────────────────────────────────────

/**
 * DELETE /cart/coupon
 * Remove applied coupon and recalculate totals.
 */
export async function removeCoupon(): Promise<void> {
  const raw = await browserDelete<unknown>("/cart/coupon");
  validate(successResponseSchema, raw);
}

// ─── 9. Checkout ──────────────────────────────────────────────────────────────

/**
 * POST /cart/checkout
 * Complete checkout: lock plots, process coupon, generate order.
 * This is atomic - all operations succeed or fail together.
 */
export async function checkoutCart(): Promise<CheckoutResult> {
  const raw = await browserPost<unknown>("/cart/checkout");
  const parsed = validate(checkoutResponseSchema, raw);
  return parsed.data ?? {};
}
