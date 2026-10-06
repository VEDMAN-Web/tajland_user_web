import { z } from "zod";

// Real `GET /cart` item (Swagger's `CartResponseDto` is out of date).
const cartItemSchema = z.object({
  plotId: z.string().min(1),
  plotNumber: z.string().nullish(),
  name: z.string().nullish(),
  imageUrl: z.string().nullish(),
  sizeRai: z.number(),
  pricePerRai: z.number(),
  subtotal: z.number(),
  region: z.object({ id: z.string(), name: z.string() }).nullish(),
  city: z.string().nullish(),
  // e.g. { name: "Icon 01", tier: "ICON" }; the tier also groups the Order Summary.
  zone: z.object({ id: z.string(), name: z.string(), tier: z.string() }).nullish(),
});

/** Real `GET /cart` `data`: the items only (totals come from `GET /cart/order-summary`). */
export const cartSchema = z.object({
  items: z.array(cartItemSchema),
});

/** Real `GET /cart/order-summary` `data`: the cart's totals and minimum check. */
export const cartSummarySchema = z.object({
  plots: z.number().int().nonnegative(),
  totalRai: z.number(),
  // One row per tier (ICON, POPULAR, STANDARD), including those at 0.
  zones: z.array(z.object({ tier: z.string(), name: z.string(), amount: z.number() })),
  subtotal: z.number(),
  discount: z.number(),
  total: z.number(),
  currency: z.string(),
  minimumRai: z.number(),
  remainingRai: z.number(),
  checkoutEligible: z.boolean(),
  // English copy from the backend; the page shows the translated Figma text instead.
  minimumPurchase: z
    .object({ reached: z.boolean(), title: z.string(), message: z.string() })
    .optional(),
  // Present when the summary was asked for with `?couponId=`.
  coupon: z
    .object({
      id: z.string(),
      name: z.string(),
      code: z.string(),
      discountPercentage: z.number(),
    })
    .nullish(),
});

/** Real `GET /coupons` `data`: coupons whose Rai range fits the current cart. */
export const cartCouponsSchema = z.object({
  sizeRai: z.number(),
  coupons: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string(),
      code: z.string(),
      discountPercentage: z.number(),
      description: z.string().nullish(),
    }),
  ),
});

export type Cart = z.infer<typeof cartSchema>;
export type CartItem = z.infer<typeof cartItemSchema>;
export type CartSummary = z.infer<typeof cartSummarySchema>;
export type CartCoupon = z.infer<typeof cartCouponsSchema>["coupons"][number];

/** Real `POST /checkout` `data`: the pending order (paid in the next step). */
export const checkoutResultSchema = z.object({ orderId: z.string().min(1) });

export type CheckoutContact = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
};

/** `POST /checkout` body. `recipient` only for a gift. */
export type CheckoutInput = {
  purchaseType: "self" | "gift";
  buyer: CheckoutContact;
  recipient?: CheckoutContact & {
    personalMessage?: string;
    sendCertificateDirectly: boolean;
  };
  couponId?: string;
};

/** Real `POST /payments` `data` (the dummy provider answers "succeeded" at once). */
export const paymentResultSchema = z.object({
  id: z.string(),
  orderId: z.string(),
  // Set once the payment succeeded, e.g. "ORD-2026-00001".
  orderNo: z.string().nullish(),
  status: z.string(),
  amount: z.number(),
  currency: z.string(),
});

/** `GET /orders/{id}` `data` (fields the confirmation uses; Swagger `OrderResponseDto`). */
export const orderSchema = z.object({
  id: z.string(),
  orderNo: z.string().nullish(),
  purchaseType: z.enum(["self", "gift"]),
  items: z.array(
    z.object({
      plotId: z.string(),
      // Zone tier, e.g. "ICON".
      zone: z.string(),
      rai: z.number(),
      price: z.number(),
      plotNumber: z.string().nullish(),
      name: z.string().nullish(),
      imageUrl: z.string().nullish(),
      // City name, e.g. "Phuket".
      location: z.string().nullish(),
      sizeSquareFeet: z.number().nullish(),
      pricePerRai: z.number().nullish(),
    }),
  ),
  totalPlots: z.number(),
  totalRai: z.number(),
  total: z.number(),
  currency: z.string(),
  // pending_payment | paid | failed | cancelled | expired
  status: z.string(),
  recipient: z
    .object({ firstName: z.string(), lastName: z.string(), email: z.string() })
    .partial()
    .nullish(),
  // Certificate image, set once the order is paid.
  certificateUrl: z.string().nullish(),
});

export type PaymentResult = z.infer<typeof paymentResultSchema>;
export type Order = z.infer<typeof orderSchema>;
