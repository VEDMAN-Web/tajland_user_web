import { z } from "zod";

// One plot in an order (`OrderItemResponseDto`).
const orderListItemSchema = z.object({
  plotId: z.string(),
  zone: z
    .object({
      name: z.string().nullish(),
      // "ICON", "POPULAR" or "STANDARD".
      type: z.string().nullish(),
    })
    .nullish(),
  rai: z.number().nonnegative(),
  price: z.number().nonnegative(),
  plotNumber: z.string().nullish(),
  name: z.string().nullish(),
  region: z.object({ name: z.string().nullish() }).nullish(),
});

// `GET /orders` item: the signed-in user's orders, newest first.
const orderListEntrySchema = z.object({
  id: z.string().min(1),
  // Set once paid, e.g. "ORD-2026-00001"; null while pending/failed/cancelled/expired.
  orderNo: z.string().nullish(),
  purchaseType: z.enum(["self", "gift"]),
  items: z.array(orderListItemSchema),
  totalPlots: z.number().int().nonnegative(),
  totalRai: z.number().nonnegative(),
  // After any coupon discount.
  total: z.number().nonnegative(),
  currency: z.string(),
  // pending_payment | paid | failed | cancelled | expired
  status: z.string(),
  paidAt: z.string().nullish(),
  createdAt: z.string(),
  // Set once paid, e.g. "CERT-2026-00001", with the certificate image URL.
  certificateNo: z.string().nullish(),
  certificateUrl: z.string().nullish(),
});

export const orderListSchema = z.array(orderListEntrySchema);

export type OrderListEntry = z.infer<typeof orderListEntrySchema>;

const personSchema = z.object({ firstName: z.string().nullish(), lastName: z.string().nullish() });

// `GET /orders/{id}` `data`: one order with its plots, totals and payment.
const orderDetailItemSchema = orderListItemSchema.extend({
  imageUrl: z.string().nullish(),
  // City name, e.g. "Phuket City".
  location: z.string().nullish(),
  latitude: z.number().nullish(),
  longitude: z.number().nullish(),
  pricePerRai: z.number().nullish(),
  region: z.object({ id: z.string().nullish(), name: z.string().nullish() }).nullish(),
});

export const orderDetailSchema = orderListEntrySchema.extend({
  items: z.array(orderDetailItemSchema),
  subtotal: z.number().nonnegative(),
  coupon: z.object({ code: z.string().nullish() }).nullish(),
  discountAmount: z.number().nonnegative().nullish(),
  buyer: personSchema.nullish(),
  // Gift orders only.
  recipient: personSchema.nullish(),
});

export type OrderDetail = z.infer<typeof orderDetailSchema>;
export type OrderDetailItem = z.infer<typeof orderDetailItemSchema>;
