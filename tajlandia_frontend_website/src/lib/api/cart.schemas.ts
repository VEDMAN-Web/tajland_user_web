/**
 * Cart API Zod schemas and TypeScript types.
 *
 * Validated against real backend responses from
 * https://tajlandai-backend.onrender.com/api/v1/cart
 */

import { z } from "zod";

// ─── Cart Item ────────────────────────────────────────────────────────────────

export const cartItemSchema = z.object({
  plotId: z.string(),
  region: z.string().optional(),
  city: z.string().optional(),
  zone: z.string().optional(),
  coordinates: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }).optional(),
  sizeRai: z.number(),
  pricePerRai: z.number(),
  subtotal: z.number(),
  expiresAt: z.string().optional(),
});
export type CartItem = z.infer<typeof cartItemSchema>;

// ─── GET /cart  ── Real backend response shape ────────────────────────────────
// Actual: { success, message, data: { totalRai, subtotal, discount, total,
//           minimumRai, remainingRai, valid, checkoutEligible, message, items? } }

export const cartResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    items: z.array(cartItemSchema).optional().default([]),
    totalRai: z.number(),
    subtotal: z.number(),           // backend uses subtotal (not totalPrice)
    discount: z.number().optional().default(0),
    total: z.number(),              // backend uses total (not totalPrice)
    minimumRai: z.number(),
    remainingRai: z.number(),
    valid: z.boolean(),             // backend uses valid (not minimumReached)
    checkoutEligible: z.boolean(),  // backend specific field
    message: z.string().optional(), // backend sends inner message too
    couponCode: z.string().optional(),
  }),
});
export type CartResponse = z.infer<typeof cartResponseSchema>;
export type Cart = CartResponse["data"];

// ─── POST /cart/validate ──────────────────────────────────────────────────────

export const cartValidationResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    valid: z.boolean(),
    totalRai: z.number(),
    total: z.number(),
    minimumRai: z.number(),
    remainingRai: z.number(),
    checkoutEligible: z.boolean().optional(),
    issues: z.array(z.string()).optional(),
    message: z.string().optional(),
  }),
});
export type CartValidationResponse = z.infer<typeof cartValidationResponseSchema>;
export type CartValidation = CartValidationResponse["data"];

// ─── POST /cart/coupon ────────────────────────────────────────────────────────

export const couponResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    code: z.string().optional(),
    discount: z.number().optional(),
    discountType: z.enum(["PERCENTAGE", "FIXED"]).optional(),
    total: z.number().optional(),
    subtotal: z.number().optional(),
  }).optional(),
});
export type CouponResponse = z.infer<typeof couponResponseSchema>;

// ─── POST /cart/checkout ──────────────────────────────────────────────────────

export const checkoutResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.object({
    orderId: z.string().optional(),
    total: z.number().optional(),
    totalRai: z.number().optional(),
    plots: z.array(z.string()).optional(),
    paymentRequired: z.boolean().optional(),
    paymentUrl: z.string().optional(),
  }).optional(),
});
export type CheckoutResponse = z.infer<typeof checkoutResponseSchema>;
export type CheckoutResult = NonNullable<CheckoutResponse["data"]>;

// ─── Generic Success ──────────────────────────────────────────────────────────

export const successResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
});
export type SuccessResponse = z.infer<typeof successResponseSchema>;

// ─── Request Bodies ───────────────────────────────────────────────────────────

export const addToCartRequestSchema = z.object({
  plotId: z.string(),
});
export type AddToCartRequest = z.infer<typeof addToCartRequestSchema>;

export const updateCartItemRequestSchema = z.object({
  rai: z.number().positive(),
});
export type UpdateCartItemRequest = z.infer<typeof updateCartItemRequestSchema>;

export const applyCouponRequestSchema = z.object({
  code: z.string().min(1),
});
export type ApplyCouponRequest = z.infer<typeof applyCouponRequestSchema>;
