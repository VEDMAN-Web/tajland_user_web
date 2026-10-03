import { z } from "zod";

// Real `GET /explore/plots` shape. Swagger's example (`data.plots`, `raiSize`,
// `basePrice`) is out of date; the API returns `data.items` with these fields.
const explorePlotSchema = z.object({
  id: z.string().min(1),
  plotNumber: z.string(),
  // AVAILABLE | LOCKED | CLAIMED | SOLD
  status: z.string(),
  coordinates: z.object({ lat: z.number(), lng: z.number() }),
  geometry: z
    .object({
      type: z.literal("Polygon"),
      coordinates: z.array(z.array(z.array(z.number()).min(2))),
    })
    .nullish(),
  sizeRai: z.number(),
  pricePerRai: z.number(),
  totalPrice: z.number(),
  currency: z.string(),
  imageUrl: z.string().nullish(),
  isOwned: z.boolean().optional(),
  isInCart: z.boolean().optional(),
  // In the Figma card but not in the list response yet; shown once the backend sends them.
  name: z.string().min(1).optional(),
  isGifted: z.boolean().optional(),
  zone: z.object({ tier: z.string() }).partial().optional(),
  region: z.object({ id: z.string(), name: z.string(), slug: z.string() }).optional(),
});

/** `GET /explore/plots` `data` (one page). */
export const explorePlotsPageSchema = z.object({
  items: z.array(explorePlotSchema),
  pagination: z.object({
    page: z.number().int(),
    limit: z.number().int(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }),
});

export type ExplorePlot = z.infer<typeof explorePlotSchema>;
