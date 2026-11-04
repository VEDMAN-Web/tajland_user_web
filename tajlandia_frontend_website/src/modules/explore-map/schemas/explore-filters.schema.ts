import { z } from "zod";

const rangeSchema = z.object({ min: z.number(), max: z.number() });

// Real `GET /explore/filters` `data`. Swagger also promises regions, cities,
// statuses and counts; the API only sends these today. (`zoneTypes`, the
// region's zones, is also sent but the panel filters by category instead.)
export const filterOptionsSchema = z.object({
  // Pricing categories ("Icon", "Popular", "Standard"), the same for every region.
  zoneCategories: z.array(
    z.object({
      id: z.string().min(1),
      name: z.string(),
      type: z.string(),
    }),
  ),
  raiRange: rangeSchema,
  // Total price (USD), the same field `minPrice` / `maxPrice` filter on.
  priceRange: rangeSchema,
});

export type FilterOptions = z.infer<typeof filterOptionsSchema>;
