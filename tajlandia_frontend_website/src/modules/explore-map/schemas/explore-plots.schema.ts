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

const placeRefSchema = z.object({ id: z.string(), name: z.string(), slug: z.string() });

// Real `GET /explore/plots/{plotId}` `data`. Swagger only lists the topics
// (no schema), so this follows the actual response.
export const explorePlotDetailSchema = explorePlotSchema.extend({
  name: z.string().min(1),
  region: placeRefSchema,
  // The plot's city.
  location: placeRefSchema.nullish(),
  zone: placeRefSchema.extend({ tier: z.string() }).nullish(),
  description: z.string().nullish(),
  // The API sends square feet, not square metres.
  sizeSquareFeet: z.number().nullish(),
  purchase: z
    .object({
      available: z.boolean(),
      minimumRequired: z.boolean(),
      reason: z.string(),
    })
    .partial()
    .nullish(),
});

export type ExplorePlotDetail = z.infer<typeof explorePlotDetailSchema>;
