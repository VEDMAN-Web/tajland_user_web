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
});

export type Cart = z.infer<typeof cartSchema>;
export type CartItem = z.infer<typeof cartItemSchema>;
export type CartSummary = z.infer<typeof cartSummarySchema>;
