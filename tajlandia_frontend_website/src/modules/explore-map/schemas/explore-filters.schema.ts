import { z } from "zod";

const rangeSchema = z.object({ min: z.number(), max: z.number() });

// Real `GET /explore/filters` `data`. Swagger also promises regions, cities,
// statuses and counts; the API only sends these three today.
export const filterOptionsSchema = z.object({
  zoneTypes: z.array(
    z.object({
      id: z.string().min(1),
      // e.g. "Icon 01"; the panel shows the tier instead.
      name: z.string(),
      tier: z.string(),
    }),
  ),
  raiRange: rangeSchema,
  // Total price (USD), the same field `minPrice` / `maxPrice` filter on.
  priceRange: rangeSchema,
});

export type FilterOptions = z.infer<typeof filterOptionsSchema>;
