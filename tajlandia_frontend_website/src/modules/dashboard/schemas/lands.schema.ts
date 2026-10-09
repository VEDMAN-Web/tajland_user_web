import { z } from "zod";

// `GET /lands/overview` `data`: zeros when the user has no paid orders.
export const landOverviewSchema = z.object({
  totalOwned: z.number().nonnegative(),
  totalLands: z.number().int().nonnegative(),
  totalSpent: z.number().nonnegative(),
  currency: z.string(),
});

// One card per paid order item. Rai and amountPaid come from the order item,
// the rest from the plot.
const landPlotSchema = z.object({
  plotId: z.string().min(1),
  plotNumber: z.string(),
  // Not sent yet; the card falls back to the zone name.
  name: z.string().nullish(),
  imageUrl: z.string().nullish(),
  zone: z.string(),
  zoneName: z.string().nullish(),
  region: z.string(),
  city: z.string().nullish(),
  rai: z.number().nonnegative(),
  pricePerRai: z.number().nonnegative(),
  amountPaid: z.number().nonnegative(),
  currency: z.string(),
  orderId: z.string(),
  orderNo: z.string().nullish(),
  certificateNo: z.string().nullish(),
  certificateUrl: z.string().nullish(),
  paidAt: z.string().nullish(),
  latitude: z.number().nullish(),
  longitude: z.number().nullish(),
});

export const landPlotsSchema = z.object({
  plots: z.array(landPlotSchema),
  pagination: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }),
});

export type LandOverview = z.infer<typeof landOverviewSchema>;
export type LandPlot = z.infer<typeof landPlotSchema>;
export type LandPlotsPage = z.infer<typeof landPlotsSchema>;
